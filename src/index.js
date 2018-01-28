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
// import { DataService, DataServiceEventEmitter } from './services/data.service';
// import { WebService } from './services/webservice.service';
var logger_1 = require("./logger");
var Index = /** @class */ (function (_super) {
    __extends(Index, _super);
    // static logger = new CommonLogger('index');
    // static dataService = new DataService();
    // static eventEmitter: DataServiceEventEmitter = DataService.InitializedEmitter;
    //static webService = new WebService();
    function Index() {
        var _this = _super.call(this, 'Index') || this;
        var fs = require('fs');
        var extraSettings = fs.readFileSync('/data/config.json', 'utf8');
        thia.log(extraSettings);
        return _this;
        // Index.eventEmitter.on('onDatabaseReady', () => {
        //     Index.logger.log(
        //         'database is ready!'
        //     );
        // });
    }
    return Index;
}(logger_1.CommonLogger));
new Index();
