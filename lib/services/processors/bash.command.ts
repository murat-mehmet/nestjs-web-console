import {Injectable} from "@nestjs/common";
import {spawn} from "child_process";
import _ from "lodash";
import {CommandProcessParameters} from "../web.console.service";
import {ConsoleCommand} from "./base/console.command";

@Injectable()
export class BashCommand extends ConsoleCommand {
    constructor() {
        super();
        this.command = 'bash';
        this.description = 'Creates a bash process';
    }

    getInput(input) {
        const postCommand = 'echo " " && echo $(pwd) $\n';
        return input ? (input + ' && ' + postCommand) : postCommand;
    }

    async process({logRaw, arg, session, parseArgs, readLine}: CommandProcessParameters) {
        await new Promise((res, rej) => {
            const process = spawn('sh', parseArgs());
            session.onCancelSignal = () => {
                process.kill("SIGINT");
            }
            session.onCancel = () => {
                process.kill();
            }
            const handleOutput = chunk => {
                let out = new Buffer(chunk, 'utf-8').toString();
                const waitingInput = out.charCodeAt(out.length - 2) == 36;
                if (waitingInput) {
                    if (out.endsWith('\n'))
                        out = out.slice(0, -1);
                    out = escapeHtml(out).replace(/\n/g, '<br/>').replace(/\r/g, '').replace(/\s\s/g, ' &nbsp;');
                    const [, ...captures] = out.match(/(.*<br\/>)?(.*)/m)
                    _.dropRight(captures, 1).forEach(capture => capture && logRaw(capture));
                    readLine(_.last(captures) || '').then(input => {
                        process.stdin.write(this.getInput(input));
                    })
                } else {
                    out = escapeHtml(out).replace(/\n/g, '<br/>').replace(/\r/g, '').replace(/\s\s/g, ' &nbsp;');
                    out && logRaw(out)
                }
            }
            const handleError = chunk => {
                let out = new Buffer(chunk, 'utf-8').toString();
                if (out.endsWith('\n'))
                    out = out.slice(0, -1);
                out = escapeHtml(out).replace(/\n/g, '<br/>').replace(/\r/g, '').replace(/\s\s/g, ' &nbsp;');
                out && logRaw(out)

                logRaw('&nbsp;');
                if (!process.killed)
                    process.stdin.write(this.getInput(null));
            }
            process.stdout.on('data', handleOutput);
            process.stderr.on('data', handleError);
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

            if (!arg) {
                process.stdin.write(this.getInput(null))
            }
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
