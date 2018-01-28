import { DataService, DataServiceEventEmitter } from './services/data.service';
import { WebService } from './services/webservice.service';
import { CommonLogger } from './logger';

class Index extends CommonLogger {
    static logger = new CommonLogger('index');
    static dataService = new DataService();
    static eventEmitter: DataServiceEventEmitter = DataService.InitializedEmitter;

    static webService = new WebService();

    constructor () {
        super('Index');

        Index.eventEmitter.on('onDatabaseReady', () => {
            Index.logger.log(
                'database is ready!'
            );
        });
    }
}

new Index();












