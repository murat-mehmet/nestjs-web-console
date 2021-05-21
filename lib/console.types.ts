import {Type} from "@nestjs/common";
import {ConsoleCommand} from "./services/processors/base/console.command";

export interface SessionObject {
    logs: string,
    isLogged: boolean,
    expires: number,
    running: boolean,
    readLineCallback?: (input: string) => any,
    readLineOpts?: ReadLineOptions,
    cancel?: boolean;
    onCancel?: () => any;
}

export interface ReadLineOptions {
    secure?: boolean,
    select?: string[] | string[][]
}

export interface ReadArgMap {
    title: string
    expect?: RegExp | 'email'
    expectDesc?: string
    opts?: ReadLineOptions
    then?: (input) => ReadArgMap[]
    default?: string
}

export interface ConsoleOptions {
    name?: string,
    masterPin: string,
    guard?: GuardOptions,
    session?: SessionOptions
}

export interface GuardOptions {
    enabled?: boolean,
    maxTries?: number,
    cooldown?: number
}
export interface SessionOptions {
    timeout?: number,
}

export interface ConsoleModuleAsyncOptions {
    endpoint?: string
    imports?,
    commands?: (Type<ConsoleCommand>)[]
    inject?,
    useFactory: (
        ...args: any[]
    ) => Promise<ConsoleOptions> | ConsoleOptions;
}

export interface ConsoleModuleOptions {
    endpoint?: string
    imports?,
    commands?: (Type<ConsoleCommand>)[]
    options: ConsoleOptions;
}

export const DEFAULT_OPTIONS: ConsoleOptions = {
    masterPin: 'must-set',
    name: 'NestJs App',
    guard: {
        enabled: true,
        cooldown: 60000 * 5,
        maxTries: 3
    },
    session: {
        timeout: 24 * 60 * 60000
    }
}