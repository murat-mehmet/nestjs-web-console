import {Injectable} from "@nestjs/common";
import {CommandProcessParameters, WebConsoleService} from "../web.console.service";
import {ConsoleCommand} from "./base/console.command";

@Injectable()
export class HelpCommand extends ConsoleCommand {
    constructor(readonly webConsoleService: WebConsoleService) {
        super();
        this.command = 'help';
        this.description = 'Lists all commands'
        this.requiresAuth = false;
    }

    async process({log, toTable}: CommandProcessParameters) {
        const entities = this.webConsoleService.allCommands.map(x => ({
            Command: x.command,
            Description: x.description
        }));
        log(toTable(entities))
    }

}
