import { DataService, DataServiceEventEmitter } from './services/data.service';
import { WebService } from './services/webservice.service';

import { CommonLogger } from './logger';

const logger = new CommonLogger('index');
const dataService = new DataService();
const eventEmitter: DataServiceEventEmitter = DataService.InitializedEmitter;

const webService = new WebService();

eventEmitter.on('onDatabaseReady', () => {
    logger.log('database is ready!');

    // const result = dataService.addResourceText({userId: 1, type: 'text', key: 'JTDD-TEXT-0008', content: 'My "First" Comments\''}, (result) => {
    //     if (result['error']) {
    //         logger.log(result.msg);
    //     } else {
    //         logger.log('OK');
    //     }
    // });

    // const result = dataService.updateResourceText({userId: 1, type: 'text', key: 'JTDD-TEXT-0009', lang: 'zh', content: 'Update My "First" Comments\''}, (result) => {
    //     if (result['error']) {
    //         logger.log(result.msg);
    //     } else {
    //         logger.log('OK');
    //     }
    // });

    // const result = dataService.removeResourceText({userId: 1, key: 'JTDD-TEXT-0001'}, (result) => {
    //     if (result['error']) {
    //         logger.log(result.msg);
    //     } else {
    //         logger.log('OK');
    //     }
    // });

    // const result = dataService.changeResourceTextKey({userId: 1, key: 'JTDD-TEXT-0007', newKey: 'JTDD-TEXT-0009'}, (result) => {
    //     if (result['error']) {
    //         logger.log(result.msg);
    //     } else {
    //         logger.log('OK');
    //     }
    // });

    // const result = dataService.getAllResourceText((result) => {
    //     if (result['error']) {
    //         logger.log(result.msg);
    //     } else {
    //         logger.log(result);
    //         logger.log('OK');
    //     }
    // });

    const result = dataService.verifyToken('ZnJhbmtzOjEyMzQ1', (result) => {
        if (result['error']) {
            logger.log(result.msg);
        } else {
            logger.log(result);
            logger.log('OK');
        }
    });





    // let webSocketService = new WebSocketService();

    //dataService.addUser('franks6');
    //dataService.removeUser('franks2');

    // dataService.createTestCase(3, {name: 'new test case 1', desc: 'test case new 1 desc'}, (result) => {
    //     logger.log(result);
    // });

    // dataService.removeTestCase(15, (result) => {
    //     logger.log('removed!');
    // });

    // dataService.addTestCaseRecord(5, 'test case 5 record 1', (result) => {
    //     logger.log('test case record was added');
    // });
    // dataService.addTestCaseRecord(5, 'test case 5 record 2', (result) => {
    //     logger.log('test case record was added');
    // });
    // dataService.addTestCaseRecord(5, 'test case 5 record 3', (result) => {
    //     logger.log('test case record was added');
    // });

    // dataService.dumpTeatCaseRecords(5, 'D:\\git_work\\macrotracingserver\\dump\\', () => {
    //     logger.log('file is dumped!');
    // });

});





