import {BadRequestException, Injectable} from "@nestjs/common";
import _ from "lodash";
import {ReadLineOptions} from "../console.types";
import {WebConsoleService} from "./web.console.service";

@Injectable()
export class RemoteConsoleService {
    openInvitations: {[remoteName: string]: {expireTimer, version, path}} = {};

    constructor(readonly webConsoleService: WebConsoleService) {}

    isJoined(remoteName: string) {
        return _(this.webConsoleService.session).values().some(x => x.joinedConnection?.name == remoteName);
    }

    inviteThisConsole(remoteName: string, version: string, path: string) {
        if (!remoteName) throw new BadRequestException('name cannot be empty');
        let result = {
            joined: this.isJoined(remoteName)
        };
        if (result.joined) return result;

        const existingInvitation = this.openInvitations[remoteName];
        const expireAction = () => {
            delete this.openInvitations[remoteName];
        };
        if (existingInvitation) {
            clearTimeout(existingInvitation.expireTimer)
            existingInvitation.expireTimer = setTimeout(expireAction, 4000);
        } else {
            this.openInvitations[remoteName] = {
                expireTimer: setTimeout(expireAction, 4000),
                version,
                path
            }
        }
        return result;
    }

    async pumpStream(input: {
        name: string,
        result: string,
        running: boolean,
        readLine: boolean,
        readLineOpts: ReadLineOptions
        time
    }) {
        if (!input.name) throw new BadRequestException('name cannot be empty');
        const session = _(this.webConsoleService.session).values().find(x => x.joinedConnection?.name == input.name);
        if (!session)
            throw new BadRequestException('connection closed');
        if (!session.joinedConnection)
            throw new BadRequestException('Connection was closed by remote end');

        //override running states if a command is about to be sent
        if (session.joinedConnection.command != null){
            if (!session.joinedConnection.running)
                input.running = true;
            else if (session.joinedConnection.readLine)
                input.readLine = false;
        }
        Object.assign(session.joinedConnection, input);
        session.joinedConnection.onStream.call(this);
        const command = session.joinedConnection.command;
        session.joinedConnection.command = null;
        return {command};
    }

    async closeFromRemote(remoteName: string) {
        if (!remoteName) throw new BadRequestException('name cannot be empty');

        const session = _(this.webConsoleService.session).values().find(x => x.joinedConnection?.name == remoteName);
        if (session) {
            session.cancel = true;
            session.onCancel?.call(this);
            if (session.readLineCallback) {
                session.readLineCallback(null);
                session.logs += '</div>';
                session.readLineCallback = null;
            }
            session.logs += '<div>Connection was closed by remote end</div><br/>';
            session.running = false;
            session.joinedConnection = null;
        }
        return {success: true};
    }
}
