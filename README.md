# Web Console for NestJS
*Command from anywhere.*

The goal is to create a simple web interface to run commands on the server.
   
## Installation 
```sh
npm install nestjs-web-console --save
yarn add nestjs-web-console
```

This library is a NestJs module with express dependency so make sure following libs are also installed.
```sh
npm install @nestjs/common @nestjs/core express rxjs --save
yarn add @nestjs/common @nestjs/core express rxjs
```
## Usage
#### Simple usage
```javascript
import {Module} from '@nestjs/common';
import {WebConsoleModule} from "nestjs-web-console";

@Module({
    imports: [WebConsoleModule.forRoot({
        endpoint: 'console',
        options: {
            name: 'My App',
            masterPin: 'very-secure-pin'
        }
    })]
})
export class AppModule {}
```
#### Async usage
```javascript
import {Module} from '@nestjs/common';
import {WebConsoleModule} from "nestjs-web-console";

@Module({
    imports: [WebConsoleModule.forRootAsync({
        endpoint: 'console',
        useFactory: (configService: ConfigService) => ({
            name: configService.get('SERVICE_NAME'),
            masterPin: configService.get('MASTER_PIN')
        }),
        inject: [ConfigService]
    })]
})
export class AppModule {}
```

To use csv temp files run
```sh
npm install csv-express --save
```
and in main.ts file
```javascript
import 'csv-express';
```

## Test 
```sh
npm run test
```
