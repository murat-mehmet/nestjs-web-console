import {Inject, Injectable} from "@nestjs/common";
import {ModuleRef} from "@nestjs/core";
import express from "express";
import {ConsoleOptions, ReadArgMap, ReadLineOptions, SessionObject} from "../console.types";
import {ConsoleCommand} from "./processors/base/console.command";
import {InvalidCommand} from "./processors/base/invalid.command";
import {NotLoggedCommand} from "./processors/base/not-logged.command";

@Injectable()
export class WebConsoleService {
    allCommands: ConsoleCommand[] = [];
    session: {[sessionId: string]: SessionObject} = {};
    @Inject('CONFIG_ROOT_OPTIONS') consoleOptions: ConsoleOptions;

    constructor(private moduleRef: ModuleRef) {
        (async () => {
            const {ALL_COMMANDS} = await import('./all.commands');
            for (let i = 0; i < ALL_COMMANDS.length; i++) {
                let COMMAND = ALL_COMMANDS[i];
                this.allCommands.push(await moduleRef.create(COMMAND));
            }
        })().catch(console.warn)
    }

    parse(commandLine: string, session: SessionObject) {
        const index = commandLine.indexOf(' ');
        let command = '', arg = '';

        session.logs += `web:/> ${commandLine}<br/>`

        try {
            if (index == -1) {
                command = commandLine;
            } else {
                command = commandLine.substring(0, index);
                arg = commandLine.substring(index + 1);
            }
        } catch (e) {
        }
        if (!command)
            return this.createInvalidCommand(commandLine, '');
        const commandObj = this.allCommands.find(x => x.command.toLowerCase() == command);
        if (!commandObj)
            return this.createInvalidCommand(commandLine, command);

        if (commandObj.requiresAuth && !session.isLogged)
            return this.createNotLoggedCommand(commandLine, '');

        return {
            cmd: commandObj,
            arg
        };
    }

    createInvalidCommand(rawCommand: string, command: string) {
        const cmd = new InvalidCommand();
        return {cmd, arg: command};
    }

    createNotLoggedCommand(rawCommand: string, command: string) {
        const cmd = new NotLoggedCommand();
        return {cmd, arg: command};
    }

    toTable(entities: any[] | any, noColumns?: boolean) {
        if (!entities)
            return 'Empty object';
        const isArray = Array.isArray(entities);
        if (!isArray && typeof entities != 'object')
            entities = {Result: entities};
        if (!isArray && (!entities || !Object.keys(entities).length))
            return 'Empty object';
        else if (isArray && !entities.length)
            return 'No records';
        const columns = noColumns ? [0] : Object.keys(isArray ? entities[0] : entities);
        let html = "<table border='1'>";
        //add header row
        if (!noColumns) {
            html += "<thead><tr>";
            for (let i = 0; i < columns.length; i++)
                html += "<th>" + columns[i] + "</th>";
            html += "</tr></thead>";
        }
        //add rows
        for (let i = 0; i < (isArray ? entities.length : 1); i++) {
            html += "<tr>";
            for (let j = 0; j < columns.length; j++)
                html += "<td>" + (noColumns ? (isArray ? entities[i] : entities) : (isArray ? entities[i][columns[j]] : entities[columns[j]]))?.toString() + "</td>";
            html += "</tr>";
        }
        html += "</table>";
        return html;
    }

    readLine(session: SessionObject, title: string, opts?: ReadLineOptions) {
        return new Promise<string>((res, rej) => {
            if (session.cancel) return rej('Operation canceled');
            session.logs += '<div class="row">' + title + '&nbsp;';
            session.readLineOpts = opts || {};
            session.readLineCallback = (input) => {
                if (session.cancel) return rej('Operation canceled');
                let displayInput;
                if (session.readLineOpts.secure)
                    displayInput = '*'.repeat(input.length);
                else if (session.readLineOpts.select && Array.isArray(session.readLineOpts.select[0]))
                    displayInput = (session.readLineOpts.select as string[][]).find(x => x[0] == input)[1]
                else
                    displayInput = input;
                session.logs += displayInput + '</div>';
                res(input);
            };
        })
    }

    parseArgs(arg: string) {
        let parsedArgs;
        if (arg) {
            parsedArgs = arg.match(/(?<=")\w[\w\s]*(?=")|((\\")|[^" ])+/g);
        } else
            parsedArgs = [];
        return parsedArgs;
    }

    async readArgs(session: SessionObject, arg: string, mapList: ReadArgMap[]): Promise<string[]> {
        return await this._readArgs(session, mapList, this.parseArgs(arg));
    }

    getSession(req: express.Request, res: express.Response) {
        this.clearExpired();
        let sessionId = this.getAppCookies(req)['console-session'];
        if (!sessionId || !(sessionId in this.session)) {
            sessionId = this.makeId(16);
            res.cookie('console-session', sessionId);
        }
        let session = this.session[sessionId];
        if (!session)
            session = this.session[sessionId] = {
                logs: '',
                expires: Date.now() + this.consoleOptions.session.timeout,
                isLogged: false,
                running: false,
                readLineCallback: null,
                cancel: false,
                onCancel: null
            }
        else
            session.expires = Date.now() + this.consoleOptions.session.timeout;
        return session;
    }

    private async _readArgs(session: SessionObject, mapList: ReadArgMap[], parsedArgs: string[]): Promise<string[]> {
        let result = [];
        for (let i = 0; i < mapList.length; i++) {
            let map = mapList[i];
            let input;
            if (parsedArgs.length) {
                const desiredInput = parsedArgs.shift();
                if (map.opts?.select) {
                    const isArray = Array.isArray(map.opts.select[0]);
                    if (isArray) {
                        const pair = (map.opts.select as string[][]).find(x => x[1] == desiredInput);
                        if (pair)
                            input = pair[0];
                        else
                            session.logs += '<div>' + (`Invalid parameter "${desiredInput}". ${map.expectDesc || ''}`) + '</div>';
                    } else if ((map.opts.select as string[]).includes(desiredInput))
                        input = desiredInput;
                    else
                        session.logs += '<div>' + (`Invalid parameter "${desiredInput}". ${map.expectDesc || ''}`) + '</div>';
                } else
                    input = desiredInput;
            }
            while (true) {
                if (input == null)
                    input = await this.readLine(session, map.title + (map.default ? ` [${map.default}]` : ''), map.opts);
                if (!input && map.default)
                    input = map.default
                if (!map.expect || (typeof map.expect == 'string' ? expectRegex[map.expect] : map.expect).test(input))
                    break;
                session.logs += '<div>' + (`Invalid parameter "${input}". ${map.expectDesc || ''}`) + '</div>';
                input = null;
            }
            result.push(input)
            if (map.then) {
                const innerResult = await this._readArgs(session, map.then(input), parsedArgs);
                result.push(...innerResult);
            }
        }
        return result;
    }

    private clearExpired() {
        const keys = Object.keys(this.session);
        keys.forEach(key => {
            if (this.session[key].expires < Date.now()) {
                const session = this.session[key];
                session.cancel = true;
                session.onCancel?.call(this);
                if (session.readLineCallback) {
                    session.readLineCallback(null);
                    session.readLineCallback = null;
                }
                session.running = false;
                delete this.session[key];
            }
        })
    }

    private getAppCookies = (req) => {
        // We extract the raw cookies from the request headers
        const rawCookies = req.headers.cookie?.split('; ') || [];

        const parsedCookies = {};
        rawCookies.forEach(rawCookie => {
            const parsedCookie = rawCookie.split('=');
            parsedCookies[parsedCookie[0]] = parsedCookie[1];
        });
        return parsedCookies;
    };

    private makeId = length => {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}

export interface CommandProcessParameters {
    rawCommand: string,
    arg: string;
    session: SessionObject,
    req: express.Request,
    res: express.Response,
    ip: string,

    log(text: string): any,

    readArgs(mapList: ReadArgMap[]): Promise<string[]>,

    readLine(title?: string, opts?: ReadLineOptions): Promise<string>,

    parseArgs(arg?: string): string[],

    toTable(entities: any[] | any, noColumns?: boolean): string
}

const expectRegex = {
    email: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
}
