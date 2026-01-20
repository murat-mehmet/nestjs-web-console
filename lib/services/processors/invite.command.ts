import {Injectable} from "@nestjs/common";
import {CommandProcessParameters, WebConsoleService} from "../web.console.service";
import {ConsoleCommand} from "./base/console.command";
import {HttpService} from '@nestjs/axios';

@Injectable()
export class InviteCommand extends ConsoleCommand {
    constructor(readonly httpService: HttpService, readonly webConsoleService: WebConsoleService) {
        super();
        this.command = 'invite';
        this.description = 'Invite a remote console.'
        this.requiresAuth = false
    }

    async process({log, session, readLine, readArgs, parseArgs}: CommandProcessParameters) {
        const [urlOrAction, value] = await readArgs([{
            title: 'Url',
        }]);
        // if (urlOrAction && !urlOrAction.startsWith('http')){
        //     switch (urlOrAction) {
        //         case 'startup':
        //             Async
        //             break;
        //         default:
        //             log('invalid parameters');
        //     }
        // }

        //waiting connection
        if (!urlOrAction) return log('Url is required');
        const defaultId = this.webConsoleService.makeId(8);
        const name = await readLine(`Your connection name [${defaultId}]:`) || defaultId;
        log('Waiting for remote end to join...');
        let url = urlOrAction;
        if (!url.endsWith('/'))
            url += '/';
        while (!session.cancel) {
            console.log('inviting pre result')
            const result = await this.httpService.get(url + 'invite?v=1&name=' + encodeURIComponent(name)).toPromise().then(x => x.data);
            console.log('inviting result', result)
            if (result.joined) break;
            await new Promise(r => setTimeout(r, 2000));
        }
        if (session.cancel) return;
        log('Remote end is now connected to this console.')

    }

}

const serviceName = process.env.SERVICE || 'home';
