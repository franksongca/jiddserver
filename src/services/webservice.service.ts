import { CommonLogger } from './../logger';
import { PORT_SETTINGS, USER_LEVEL } from './../conf/config';
import { DataService } from './../services/data.service';

export class WebService extends CommonLogger {
    constructor() {
        super('web.service');

        const dataService: DataService = new DataService(),
            express = require('express'),
            app = express(),
            router = express.Router(),
            bodyParser = require('body-parser');

        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());
        app.use(require('cors')());

        // middleware to use for all requests
        router.use(function(req, res, next) {
            console.log('req.headers[authorization]: ' + req.headers['authorization']);

            dataService.authUser(req.headers['authorization'], (result) => {
                if (result['error'] === 0) {
                    next();
                } else {
                    res.json(result);
                }
            });
        });

        // test route to make sure everything is working (accessed at GET http://localhost:8080/api)
        router.get('/', function(req, res) {
            res.json({ message: 'hooray! welcome to our api!' });
        });

        // REGISTER OUR ROUTES -------------------------------
        // all of our routes will be prefixed with /api
        app.use('/api', router);

        // handle all requests ******************************************************
        // router.route('/create/:id/:type/:version')
        //     .get(function(req, res) {
        //         console.log('http get create - req.params : ' + req.params);
        //         res.json({msg: 'good'});
        //         // res.json(createProcess(req.params.id.replace(':', ''), req.params.type.replace(':', ''), req.params.version.replace(':', '')));
        //     });

        // this.router.route('/shutdown/:id')
        //     .get(function(req, res) {
        //         // console.log('http post - start : ' + Object.keys(req));
        //
        //         // res.json(shutdown(req.params.id.replace(':', '')));
        //     });

        router.route('/update').post(function(req, res) {
            // this parsing method is for the raw json (application/json) when sending
            // should contain valid token in the payload
            let result = req.body;

            // res.json(createProcess(req.params.id.replace(':', ''), req.params.type.replace(':', ''), req.params.version.replace(':', '')));
        });

        router.route('/login').post(function(req, res) {
            // this parsing method is for the raw json (application/json) when sending
            dataService.getUserBasicInfo(req.body, (result) => {
                res.json(result);
            });
        });

        router.route('/register').post(function(req, res) {
            // this parsing method is for the raw json (application/json) when sending
            dataService.registerUser(req.body, (result) => {
                res.json(result);
            });
        });


        app.listen(PORT_SETTINGS.webservice, '0.0.0.0');
    }

    update(data) {
        // USER_LEVEL
    }
}