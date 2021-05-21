import {CommandProcessParameters} from "../../web.console.service";
import {ConsoleCommand} from "./console.command";

export class NotLoggedCommand extends ConsoleCommand {
    process({log}: CommandProcessParameters) {
        log(`You must be logged in to execute this command.`);
    }

}
