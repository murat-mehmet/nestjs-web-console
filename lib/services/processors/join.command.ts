import {Injectable} from "@nestjs/common";
import _ from "lodash";
import {RemoteConsoleService} from "../remote.console.service";
import {CommandProcessParameters} from "../web.console.service";
import {ConsoleCommand} from "./base/console.command";

@Injectable()
export class JoinCommand extends ConsoleCommand {
    constructor(readonly remoteConsoleService: RemoteConsoleService) {
        super();
        this.command = 'join';
        this.description = 'Joins a remote console.'
        this.requiresAuth = false
    }

    async process({log, readArgs, session, readLine}: CommandProcessParameters) {
        if (!Object.keys(this.remoteConsoleService.openInvitations).length)
            return log('No open invitations');
        const [remoteName] = await readArgs([{
            title: 'Remote name',
            opts: {
                select: _(this.remoteConsoleService.openInvitations).keys().valueOf()
            }
        }])

        session.onCancelSignal = () => {
            if (session.joinedConnection) {
                session.joinedConnection.command = "ctrl+c";
            } else
                session.onCancel?.call(this);
        }
        const inv = this.remoteConsoleService.openInvitations[remoteName];
        if (!inv)
        return log('Console session no more open.');
        log('Joined console session.\n');
        const currentLogs = session.logs;
        let isOnStreamRunning = false;
        const onStream = async () => {
            if (isOnStreamRunning) return;
            isOnStreamRunning = true;
            try {
                session.logs = currentLogs + session.joinedConnection.result.replace(/\n/g, '<br/>').replace(/\r/g, '').replace(/\s\s/g, ' &nbsp;') + '<br/>';
                if (!session.joinedConnection.running) {
                    session.joinedConnection.command = await readLine(`${session.joinedConnection.path}:/>`);
                    session.joinedConnection.running = true;
                    session.logs = currentLogs + session.joinedConnection.result.replace(/\n/g, '<br/>').replace(/\r/g, '').replace(/\s\s/g, ' &nbsp;') + '<br/>';
                } else if (session.joinedConnection.readLine) {
                    session.joinedConnection.command = await readLine(session.joinedConnection.readLineOpts['title'], session.joinedConnection.readLineOpts);
                    session.joinedConnection.running = true;
                    session.logs = currentLogs + session.joinedConnection.result.replace(/\n/g, '<br/>').replace(/\r/g, '').replace(/\s\s/g, ' &nbsp;') + '<br/>';
                }

            } catch (e) {
                log(e.message);
                session.onCancel()
            }
            isOnStreamRunning = false;
        };

        session.joinedConnection = {
            name: remoteName,
            version: inv.version,
            path: inv.path,
            result: '',
            readLine: false,
            running: false,
            readLineOpts: null,
            onStream,
            command: null
        };

        await new Promise<void>(r => {
            session.onCancel = r
        })

        session.joinedConnection = null;
    }

}
