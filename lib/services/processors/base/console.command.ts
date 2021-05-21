import {CommandProcessParameters} from "../../web.console.service";

export abstract class ConsoleCommand {
    command: string;
    description: string;
    requiresAuth: boolean;

    constructor() {
        this.requiresAuth = true;
    }

    abstract process(parameters: CommandProcessParameters);

}

