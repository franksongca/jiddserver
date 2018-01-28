import { Logger, transports } from 'winston';

const fs = require('fs');
const logFormatter = function (options) {
    return options.timestamp() + ` ` + options.level.toUpperCase() +
        ` ` + (options.message ? options.message : ``) +
        (options.meta && Object.keys(options.meta).length ?
        `\n\t` + JSON.stringify(options.meta) : ``);
};

export class MyLogger extends Logger {
    constructor(logDir: string, logName: string) {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
        super({
            level: 'debug',
            transports: [
                new transports.Console(),
                new (require('winston-daily-rotate-file'))({
                    filename: logDir + '/' + '-' + logName,
                    timestamp: () => (new Date()).toLocaleTimeString(),
                    datePattern: 'yyyy-MM-dd',
                    prepend: true,
                    level: 'debug',
                    json: false,
                    formatter: logFormatter
                })
            ]
        });
    }
}

export class CommonLogger {
    logger;

    constructor(type) {
        this.logger = new MyLogger('logs', type + '.log');
    }

    log (msg) {
        // if(msg.length > 120) {
        //     msg = msg.substr(0, 120) + "......";
        // }

        if(this.logger) {
            this.logger.debug(msg);
        } else {
            console.log(msg);
        }
    }
}
