import {Injectable} from "@nestjs/common";
import {CommandProcessParameters} from "../web.console.service";
import {ConsoleCommand} from "./base/console.command";

@Injectable()
export class ClearScreenCommand extends ConsoleCommand {
    constructor() {
        super();
        this.command = 'clr';
        this.description = 'Clears screen'
        this.requiresAuth = false;
    }

    async process({session}: CommandProcessParameters) {
        session.logs = '';
    }

}
