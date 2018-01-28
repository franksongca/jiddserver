"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var winston_1 = require("winston");
var fs = require('fs');
var logFormatter = function (options) {
    return options.timestamp() + " " + options.level.toUpperCase() +
        " " + (options.message ? options.message : "") +
        (options.meta && Object.keys(options.meta).length ?
            "\n\t" + JSON.stringify(options.meta) : "");
};
var MyLogger = /** @class */ (function (_super) {
    __extends(MyLogger, _super);
    function MyLogger(logDir, logName) {
        var _this = this;
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
        _this = _super.call(this, {
            level: 'debug',
            transports: [
                new winston_1.transports.Console(),
                new (require('winston-daily-rotate-file'))({
                    filename: logDir + '/' + '-' + logName,
                    timestamp: function () { return (new Date()).toLocaleTimeString(); },
                    datePattern: 'yyyy-MM-dd',
                    prepend: true,
                    level: 'debug',
                    json: false,
                    formatter: logFormatter
                })
            ]
        }) || this;
        return _this;
    }
    return MyLogger;
}(winston_1.Logger));
exports.MyLogger = MyLogger;
var CommonLogger = /** @class */ (function () {
    function CommonLogger(type) {
        this.logger = new MyLogger('logs', type + '.log');
    }
    CommonLogger.prototype.log = function (msg) {
        // if(msg.length > 120) {
        //     msg = msg.substr(0, 120) + "......";
        // }
        if (this.logger) {
            this.logger.debug(msg);
        }
        else {
            console.log(msg);
        }
    };
    return CommonLogger;
}());
exports.CommonLogger = CommonLogger;
