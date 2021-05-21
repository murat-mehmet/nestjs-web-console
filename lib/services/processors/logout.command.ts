import {Injectable} from "@nestjs/common";
import {CommandProcessParameters} from "../web.console.service";
import {ConsoleCommand} from "./base/console.command";

@Injectable()
export class LogoutCommand extends ConsoleCommand {
    constructor() {
        super();
        this.command = 'logout';
        this.description = 'Allows you to logout from console.'
    }

    async process({arg, session, log}: CommandProcessParameters) {
        session.isLogged = false;
        log('Logged out.')
    }
}
