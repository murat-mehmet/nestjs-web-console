import {Type} from "@nestjs/common";
import {BashCommand, ClearScreenCommand, CmdCommand, HelpCommand, InviteCommand, JoinCommand, LoginCommand, LogoutCommand} from "./processors";
import {ConsoleCommand} from "./processors/base/console.command";

export const ALL_COMMANDS: Type<ConsoleCommand>[] = [
    HelpCommand,
    LoginCommand,
    LogoutCommand,
    ClearScreenCommand,
    BashCommand,
    CmdCommand,
    JoinCommand,
];
