import {DynamicModule, HttpModule, Module} from '@nestjs/common';
import _ from 'lodash';
import {ConsoleModuleAsyncOptions, ConsoleModuleOptions, DEFAULT_OPTIONS} from "./console.types";
import {WebConsoleControllerFactory} from "./controllers/web.console.controller";
import {ALL_COMMANDS} from "./services/all.commands";
import {RemoteConsoleService} from "./services/remote.console.service";
import {WebConsoleService} from "./services/web.console.service";

@Module({})
export class WebConsoleModule {
    static forRootAsync(options: ConsoleModuleAsyncOptions): DynamicModule {
        const {imports = [], commands = [], useFactory, inject, endpoint} = options;
        ALL_COMMANDS.push(...commands);
        return {
            controllers: [WebConsoleControllerFactory(endpoint)],
            imports: [
                ...!imports ? [] : imports,
                HttpModule
            ],
            exports: [
                WebConsoleService,
                ...ALL_COMMANDS,
            ],
            module: WebConsoleModule,
            providers: [
                WebConsoleService,
                RemoteConsoleService,
                {
                    provide: 'CONFIG_ROOT_OPTIONS',
                    useFactory: async (
                        ...args: any[]
                    ) => {
                        const options = await useFactory(...args);
                        return _.merge(DEFAULT_OPTIONS, options);
                    },
                    inject: !inject ? [] : [...inject]
                },
                ...ALL_COMMANDS,
            ]
        }
    }

    static forRoot(options: ConsoleModuleOptions): DynamicModule {
        const {imports = [], commands = [], endpoint} = options;
        const consoleOptions = _.merge(DEFAULT_OPTIONS, options.options);
        ALL_COMMANDS.push(...commands);
        return {
            controllers: [WebConsoleControllerFactory(endpoint)],
            imports: [
                ...!imports ? [] : imports,
                HttpModule
            ],
            exports: [
                WebConsoleService,
                ...ALL_COMMANDS
            ],
            module: WebConsoleModule,
            providers: [
                WebConsoleService,
                RemoteConsoleService,
                {
                    provide: 'CONFIG_ROOT_OPTIONS',
                    useValue: consoleOptions,
                },
                ...ALL_COMMANDS,
            ]
        }
    }
}
