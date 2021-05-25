import {Injectable} from "@nestjs/common";
import {spawn} from "child_process";
import _ from "lodash";
import {CommandProcessParameters, WebConsoleService} from "../web.console.service";
import {ConsoleCommand} from "./base/console.command";

@Injectable()
export class CmdCommand extends ConsoleCommand {
    constructor(readonly webConsoleService: WebConsoleService) {
        super();
        this.command = 'cmd';
        this.description = 'Creates a cmd process';
    }

    async process({logRaw, parseArgs, readLine, session}: CommandProcessParameters) {
        await new Promise((res, rej) => {
            const process = spawn('cmd', parseArgs());
            session.onCancel = () => {
                process.kill();
            }
            let firstResponse = true;
            let lastInput;
            const handleOutput = chunk => {
                let out = new Buffer(chunk, 'utf-8').toString();

                const waitingInput = out.charCodeAt(out.length - 1) == 62;
                out = escapeHtml(out).replace(/\n/g, '<br/>').replace(/\r/g, '').replace(/\s\s/g, ' &nbsp;');

                if (out && out.match && firstResponse) {
                    firstResponse = false;
                    const [, first, rest] = out.match(/^(.*?)<br\/>(.*)/);
                    if (first.trim() == lastInput)
                        out = rest;
                }
                if (waitingInput) {
                    const [, ...captures] = out.match(/(.*<br\/>)?(.*)/m)
                    _.dropRight(captures, 1).forEach(capture => capture && logRaw(capture));
                    readLine(_.last(captures) || '').then(input => {
                        lastInput = input
                        firstResponse = true;
                        process.stdin.write(input + '\r\n');
                    })
                } else {
                    out && logRaw(out)
                }
            }
            process.stdout.on('data', handleOutput);
            process.stderr.on('data', handleOutput);
            process.on('error', e => {
                rej(e)
            });

            function exitHandler(options, exitCode) {
                if (options.cleanup) console.log('clean');
                if (exitCode || exitCode === 0) console.log(exitCode);
                res(null);
            }

            process.on('exit', exitHandler.bind(null, {cleanup: true}));
            process.on('SIGINT', exitHandler.bind(null, {exit: true}));
            process.on('SIGUSR1', exitHandler.bind(null, {exit: true}));
            process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));
            process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
        });
    }

}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
