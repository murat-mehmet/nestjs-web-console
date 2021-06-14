import {Inject, Injectable} from "@nestjs/common";
import {ConsoleOptions} from "../../console.types";
import {CommandProcessParameters} from "../web.console.service";
import {ConsoleCommand} from './base/console.command';

@Injectable()
export class LoginCommand extends ConsoleCommand {
    guard: Guard = {failed: 0, cooldownUntil: 0};
    @Inject('CONFIG_ROOT_OPTIONS') consoleOptions: ConsoleOptions;

    constructor() {
        super();
        this.command = 'login';
        this.description = 'Allows you to login to console.';
        this.requiresAuth = false;
    }

    async process({arg, session, log, readArgs}: CommandProcessParameters) {
        if (session.isLogged) return log('Already logged in');
        const {guard} = this;
        if (guard.cooldownUntil > Date.now()) {
            log('Login cooldown. Try again later.');
            return;
        }
        const [input] = await readArgs([{
            title: 'Enter master pin',
            opts: {secure: true}
        }])
        if (this.consoleOptions.masterPin == input) {
            session.isLogged = true;
            log('Login success');
            guard.failed = 0;
        } else {
            log('Login failed');
            guard.failed++;
        }
        if (this.consoleOptions.guard.enabled && guard.failed == this.consoleOptions.guard.maxTries) {
            guard.cooldownUntil = Date.now() + this.consoleOptions.guard.cooldown;
            log('Login banned temporarily.');
        }
    }
}

interface Guard {
    failed: number;
    cooldownUntil: number;
}
