import {Body, Controller, Get, Inject, Ip, Param, Post, Query, Req, Res} from '@nestjs/common';
import ejs from 'ejs';
import express, {Request, Response} from 'express';
import {ConsoleOptions, ReadArgMap, ReadArgOptions, ReadLineOptions} from "../console.types";
import {RemoteConsoleService} from "../services/remote.console.service";
import {WebConsoleService} from "../services/web.console.service";

const boot = new Date();

export function WebConsoleControllerFactory(endpoint): any {
    @Controller(endpoint || 'console')
    class WebConsoleController {
        @Inject('CONFIG_ROOT_OPTIONS') consoleOptions: ConsoleOptions;

        view = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <title>Web Console | <%= model.name %></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style type="text/css">
        * {
            margin: 0;
            padding: 0;
        }

        html, body {
            height: 100%;
        }

        body {
            background: black;
            color: white;
            font-family: Consolas, Monaco, monospace;
            font-size: 0;
            display: flex;
            flex-direction: column;
            transition: opacity 500ms;
        }

        div#output {
            overflow-y: auto;
            overflow-x: hidden;
            padding: 5px;
            font-size: 14px;
            flex: 1;
        }

        div#bottom, div#bottom-base {
            font-size: 14px;
            display: flex;
        }

        div#bottom-base {
            padding: 10px 0;
        }

        div#bottom-base > * {
            margin-left: 10px;
        }

        span#input {
            flex: 1;
            display: flex;
        }

        input, input:focus, input:active input:focus-visible {
            font-family: Consolas, Monaco, monospace;
            background: transparent;
            border: none;
            outline: none;
            color: white;
            font-size: 14px;
            flex: 1;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px black inset !important;
        }

        input:-webkit-autofill {
            -webkit-text-fill-color: white !important;
            font-family: Consolas, Monaco, monospace;
            font-size: 14px;
        }

        div.row {
            display: flex;
        }

        select {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background-color: black;
            border: none;
            padding: 0 1em 0 0;
            margin: 0;
            width: 100%;
            font-family: inherit;
            font-size: inherit;
            cursor: inherit;
            line-height: inherit;
            color: white;
            z-index: 1;
            outline: none;
            overflow: hidden;
        }

        select::-ms-expand {
            display: none;
        }

        .select {
            display: grid;
            grid-template-areas: "select";
            align-items: center;
            position: relative;
            min-width: 15ch;
            max-width: unset;
            border: 0;
            border-radius: 0.25em;
            cursor: pointer;
            background-color: #000;
            background-image: linear-gradient(to top, #000, #000 33%);
        }

        .select select, .select::after {
            grid-area: select;
        }

        .select:not(.select--multiple)::after {
            content: "";
            justify-self: end;
            width: 0.6em;
            height: 0.35em;
            z-index: 1;
            background-color: white;
            -webkit-clip-path: polygon(100% 0%, 0 0%, 50% 100%);
            clip-path: polygon(100% 0%, 0 0%, 50% 100%);
        }

        .select.desktop:not(.select--multiple)::after {
            content: none;
        }

        .desktop-hide {
            display: none !important;
        }

        .submitting {
            pointer-events: none;
            touch-action: none;
        }

        .submitting2 {
            opacity: 0.7;
        }

        select:focus + .focus {
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            border: 0;
            border-radius: inherit;
        }

    </style>
    <script src="https://code.jquery.com/jquery-3.6.0.slim.min.js"></script>
</head>
<body>
<div id="output">
    <div>
        Web Console | <%= model.name %><br />
        All rights reserved.<br /><br />
        Server boot: <%= model.boot %><br /><br />
    </div>
    <div id="logs">
        <%- model.result %>

        <% if (model.running && model.readLine) { %>
            <form method="post" style="display: flex; flex: 1" class="commandFormInline">
                <% if (model.readLineOpts.select) { %>
                    <div class="select">
                        <select id="command" name="command" size="<%= Math.max(2,model.readLineOpts.select.length) %>"
                                autofocus="autofocus">
                            <option value="[null]" id="empty">Select...</option>
                            <% model.readLineOpts.select.forEach(function(x, i) {
                                const isArray = Array.isArray(x);
                            %>
                            <option value="<%= isArray ? x[0] : x %>"><%= isArray ? x[1] : x %></option>
                            <% }) %>
                        </select>
                        <span class="focus"></span>
                    </div>
                <% } else { %>
                    <input type="<%= model.readLineOpts.secure ? 'password' : 'text' %>" id="command" name="command" style="flex: 1"
                           autofocus="autofocus" autocomplete="off" />
                <% } %>
            </form><%- '</div>' %>
        <% } %>
    </div>
    <div id="running"></div>

    <form method="post" class="commandForm">
        <div id="bottom">
            <% if (!model.running) { %>
                <span id="path">web:/&gt;&nbsp;</span>
                <span id="input"><input type="text" id="command" name="command" autofocus="autofocus" autocomplete="off" /></span>
            <% } %>
        </div>
    </form>

    <form method="post" id="cancelForm">
        <input type="hidden" name="command" value="ctrl+c" />
    </form>
    <form method="post" id="cancelShiftForm">
        <input type="hidden" name="command" value="ctrl+shift+c" />
    </form>
</div>
<div id="bottom-base">
    <% if (model.running) { %>
        <div id="cancel">[ Terminate ]</div>
        <div id="shiftCancel">[ Cancel Signal ]</div>
    <% } else { %>
        <div id="prev">[ Previous ]</div>
        <div id="next">[ Next ]</div>
    <% } %>
</div>
<script type="text/javascript">
    document.getElementById('bottom').scrollIntoView(false);
    const commands = JSON.parse(localStorage.getItem('command-history') || '[]');
    const commandStore = {
        index: commands.length,
        commandCount: commands.length,
        prevCommand: commands,
        put: function (val) {
            if (!val)
                return;
            if (this.prevCommand.indexOf(val) > -1) {
                this.prevCommand = this.prevCommand.filter(x => x != val);
                this.commandCount = this.prevCommand.length;
            }
            this.commandCount++;
            this.index = this.commandCount;
            this.prevCommand.push(val);
            if (this.commandCount > 30) {
                this.prevCommand.shift();
                this.commandCount = this.prevCommand.length;
                this.index = this.commandCount;
            }
            localStorage.setItem('command-history', JSON.stringify(this.prevCommand));
        },
        get: function (isUp) {
            if (isUp && this.index > 0)
                this.index--;
            else if (!isUp && this.index < this.commandCount)
                this.index++;
            if (typeof this.prevCommand[this.index] !== "undefined") {
                return this.prevCommand[this.index];
            }
            return '';
        }

    }
</script>
<script type="text/javascript">
    $(document).on('keydown', function (e) {
        e = e || window.event;
        const key = e.which || e.keyCode;
        const ctrl = e.ctrlKey ? e.ctrlKey : ((key === 17) ? true : false);
        const shift = e.shiftKey ? e.shiftKey : ((key === 16) ? true : false);
        const alt = e.altKey ? e.altKey : ((key === 18) ? true : false);

        <% if (model.running) { %>

        if (key === 67 && alt && shift) {
            $('#cancelShiftForm').submit();
        } else if (key === 67 && alt) {
            $('#cancelForm').submit();
        }
        <% } else { %>

        if (key === 38 && $("input").is(":focus")) {
            const val = commandStore.get(true);
            $("input").val(val);
            const input = $("input")[0];
            setTimeout(function () { input.selectionStart = input.selectionEnd = input.value.length; }, 0);
        } else if (key === 40 && $("input").is(":focus")) {
            const val = commandStore.get(false);
            $("input").val(val);
            const input = $("input")[0];
            setTimeout(function () { input.selectionStart = input.selectionEnd = input.value.length; }, 0);
        }
        <% } %>

        if (key === 13 && $("select").is(":focus")) {
            $('form.commandFormInline').submit();
        }
    });

    <% if (!model.readLine) { %>
    $("form.commandForm").on("submit", function (e) {
        commandStore.put($('input').val());
    });
    <% } %>

    <% if (model.running && !model.readLine) { %>
    let start = +'<%= model.result.length %>';
    setInterval(() => {
        fetch('/console/substring/' + start).then(x => x.json())
            .then(x => {
                if (!x.running || x.readLine)
                    window.location.href = '/console';
                else if (x.result.length) {
                    $('#logs').append(x.result);
                    start += x.result.length;
                    document.getElementById('bottom').scrollIntoView(false);
                }
            });
    }, 1000);
    let ticks = 1;
    setInterval(() => {
        $('#running').html('.'.repeat(ticks++));
        if (ticks > 3)
            ticks = 1;
    }, 300);
    <% } %>
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
    }
    const isMobile = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement);

    <% if (model.readLine && model.readLineOpts.select) { %>
    if (isMobile) {
        $('select').on('change', function () {
            if ($(this).val() !== '[null]')
                $('form.commandFormInline').submit();
        });
        $('select').attr('size', 1);
    } else {
        $('select > option').first().remove();
        $('.select').addClass('desktop');
    }
    $('select')[0].selectedIndex = 0;
    <% } %>
    if (!isMobile) {
        $('#bottom-base').addClass('desktop-hide');
    }
    <% if (model.running) { %>
    if (isMobile) {
        $('#cancel').on('click', function () {
            $('#cancelForm').submit();
        });
        $('#shiftCancel').on('click', function () {
            $('#cancelShiftForm').submit();
        });
    }
    <% } else { %>

    if (isMobile) {
        $('#prev').on('click', function () {
            const val = commandStore.get(true);
            $("input").val(val);
            const input = $("input")[0];
            setTimeout(function () { input.selectionStart = input.selectionEnd = input.value.length; }, 0);
        });
        $('#next').on('click', function () {
            const val = commandStore.get(false);
            $("input").val(val);
            const input = $("input")[0];
            setTimeout(function () { input.selectionStart = input.selectionEnd = input.value.length; }, 0);
        });
    }
    <% } %>
    $('form').on('submit', function () {
        document.activeElement?.blur();
        $('body').addClass('submitting submitting2');
    });
    
    var longpress = false;

    $("body").on('click', function () {
        if (!longpress)
            document.getElementById('command')?.focus();
    });

    var startTime, endTime;
    $("body").on('mousedown', function () {
        startTime = new Date().getTime();
    });

    $("body").on('mouseup', function () {
        endTime = new Date().getTime();
        longpress = (endTime - startTime < 500) ? false : true;
    });
</script>
</body>
</html>
    `;

        constructor(readonly webConsoleService: WebConsoleService,readonly remoteConsoleService: RemoteConsoleService) {}

        @Get('substring/:start')
        async getSubstring(@Req() req: express.Request, @Res() res: express.Response, @Param('start') start: string) {
            const session = this.webConsoleService.getSession(req, res);
            let result;
            if (session.logs.length <= +start)
                result = '';
            else
                result = session.logs.substring(+start);
            return res.send({
                result,
                running: session.running,
                readLine: !!session.readLineCallback,
            })
        }

        @Get()
        async get(@Req() req: express.Request, @Res() res: express.Response) {
            const session = this.webConsoleService.getSession(req, res);
            return res.send(ejs.render(this.view, {
                model: {
                    name: this.consoleOptions.name,
                    result: session.logs,
                    running: session.running,
                    readLine: !!session.readLineCallback,
                    readLineOpts: session.readLineOpts,
                    boot
                }
            })
                .replace(/>[\r\n ]+</g, "><")
                .replace(/(<.*?>)|\s+/g, (m, $1) => $1 ? $1 : ' ')
                .trim());
        }


        @Post()
        async post(@Body('command') command: string, @Req() req: Request, @Res() res: Response, @Ip() ip: string) {
            if (command == null)
                command = '';
            const escaped = command.replace(/\\\|/g, '\r\n');
            const cmds = escaped.split("|").filter(x => x)
                .map(x => x.replace(/\r\n/g, '|'));
            const session = this.webConsoleService.getSession(req, res);

            if (command == 'ctrl+c') {
                session.cancel = true;
                session.onCancel?.call(this);
                if (session.readLineCallback) {
                    session.readLineCallback(null);
                    session.logs += '</div>';
                    session.readLineCallback = null;
                }
                session.logs += '<div>Operation canceled</div><br/>';
                session.running = false;
            } else if (command == 'ctrl+shift+c') {
                if (session.onCancelSignal)
                    session.onCancelSignal?.call(this);
                else {
                    session.cancel = true;
                    session.onCancel?.call(this);
                    if (session.readLineCallback) {
                        session.readLineCallback(null);
                        session.logs += '</div>';
                        session.readLineCallback = null;
                    }
                    session.logs += '<div>Operation canceled</div><br/>';
                    session.running = false;
                }
            } else {
                if (session.readLineCallback) {
                    (async () => {
                        session.readLineCallback(command);
                    })().catch(e => {
                        if (session.cancel) return;
                        session.logs += e + '<br/><br/>'
                        session.running = false;
                    })
                    session.readLineCallback = null;
                } else {
                    session.cancel = false;
                    session.onCancel = null;
                    session.running = true;
                    (async () => {
                        if (!cmds.length) {
                            session.logs += `web:/> `
                        }
                        for (let i = 0; i < cmds.length; i++) {
                            let cmd = cmds[i];
                            const {cmd: parsed, arg} = this.webConsoleService.parse(cmd, session);
                            await parsed.process({
                                session,
                                arg,
                                req,
                                res,
                                ip,
                                rawCommand: cmd,
                                log: (...text) => this.webConsoleService.log(session, this.webConsoleService.escapeHtml(text.map(x => typeof x == "object" ? JSON.stringify(x, null, 2) : x).join(' ')).replace(/\n/g, '<br/>').replace(/\r/g, '').replace(/\s\s/g, ' &nbsp;')),
                                logRaw: (text) => this.webConsoleService.log(session, text),
                                logTable: (entities,noColumns?) => this.webConsoleService.log(session, this.webConsoleService.toTable(entities, noColumns)),
                                readArgs: (mapList: ReadArgMap[], parameters?: ReadArgOptions): Promise<string[]> => this.webConsoleService.readArgs(session, arg, mapList, parameters),
                                readLine: (title?: string, opts?: ReadLineOptions): Promise<string> => this.webConsoleService.readLine(session, title || '', opts),
                                parseArgs: (funcArg?: string) => this.webConsoleService.parseArgs(funcArg || arg),
                                toTable: this.webConsoleService.toTable
                            });
                        }
                    })().catch(e => {
                        if (session.cancel) return;
                        session.logs += e + '<br/>'
                    }).finally(() => {
                        if (session.cancel) return;
                        session.logs += '<br/>'
                        session.running = false;
                    });
                }
            }
            setImmediate(() => {
                res.send(ejs.render(this.view, {
                    model: {
                        name: this.consoleOptions.name,
                        result: session.logs,
                        running: session.running,
                        readLine: !!session.readLineCallback,
                        readLineOpts: session.readLineOpts,
                        boot
                    }
                })
                    .replace(/>[\r\n ]+</g, "><")
                    .replace(/(<.*?>)|\s+/g, (m, $1) => $1 ? $1 : ' ')
                    .trim())
            })
        }

        @Get('remote/invite')
        invite(@Query() input: {name: string, v: string, p: string}){
            return this.remoteConsoleService.inviteThisConsole(input.name, input.v, input.p);
        }

        @Post('remote/stream')
        stream(@Body() input){
            console.log('strea', input)
            return this.remoteConsoleService.pumpStream(input);
        }

        @Post('remote/close')
        close(@Body() input: {name: string}){
            return this.remoteConsoleService.closeFromRemote(input.name);
        }
    }

    return WebConsoleController;
}
