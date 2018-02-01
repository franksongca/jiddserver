import {CommonLogger} from './../logger';
import {EventEmitter} from 'events';
import {DATABASE_SETTINGS, PORT_SETTINGS, ERROR_SETTINGS, USER_LEVEL, CommonService} from './../conf/config';
import {ExtraSettings} from './../data/config.js';

export class DataServiceEventEmitter extends EventEmitter {}

export class DataService extends CommonLogger {
    static Ready = false;
    static InitializedEmitter;
    mysql;
    conn;
    logger;
    static instance;

    constructor() {
        super('data.service');

        if (DataService.instance) {
            return DataService.instance;
        }

        DataService.instance = this;

        this.mysql = require('mysql');
        DataService.InitializedEmitter = new DataServiceEventEmitter();

        this.conn = this.mysql.createConnection({
            host: ExtraSettings.environment === 'local' ? ExtraSettings.localHost : ExtraSettings.remoteHost,
            port: PORT_SETTINGS.database,
            user: ExtraSettings.userName,
            password: ExtraSettings.password
        });

        this._init();
    }

    protected _init() {
        let self = this;
        this.conn.connect(function (err) {
            if (err) {
                throw err;
            }
            self.log("Connected!");

            if (ExtraSettings.cleanTablesWhenInit) {
                DATABASE_SETTINGS.tables.forEach((table) => {
                    self._query('DROP TABLE IF EXISTS ' + ExtraSettings.database + '.' + table.name, null);
                });
            }

            self._createDatabaseIfNotExisting(() => {
                self.log('Database created / existing!!!');
                self._createTables();
            });
        });
    }

    protected _query(sql, callback?) {
        this.conn.query(sql, (err, result) => {
            if (err) {
                this.log('ERROR SQL: ' + sql);

                throw err;
            }

            if (callback) {
                callback(result || []);
            }
        });
    }

    protected _verifyToken(token, callback) {
        const sql = 'SELECT * FROM ' + ExtraSettings.database + '.users';
        this._query(sql, (users) => {
            let found = false;
            users.forEach((user) => {
                if (token === new Buffer((user.userName + ':' + user.password)).toString('base64')) {
                    found = true;
                    callback(CommonService.ExtendObject(CommonService.CloneObject(ERROR_SETTINGS.NO_ERROR), {userInfo: user}));
                }
            });

            if (!found) {
                callback(ERROR_SETTINGS.INVALID_TOKEN);
            }
        });
    }

    /**
     * @method _addMember
     * @param cred      {object} - user info
     * @param callback  {function}
     * @private
     */
    protected _addMember(cred, callback) {
        const self = this;
        const sql = 'INSERT INTO ' + ExtraSettings.database +
            '.users (level, type, userName, age, sex, firstName, lastName, password, dharmaName, phone, phone1, email, address, comments) VALUES (' +
            cred.level + ', "' + cred.type + '", "' + cred.userName + '", ' + cred.age + ', "' + cred.sex + '", "' + cred.firstName + '", "' +
            cred.lastName + '", "' + cred.password + '", "' + cred.dharmaName + '", "' + cred.phone + '", "' + cred.phone1 + '", "' + cred.email + '", "' +
            cred.address + '", "' + cred.comments + '")';

        this._userNameExists(cred.userName, (isUserExisting) => {
            if (isUserExisting) {
                callback(ERROR_SETTINGS.USER_NAME_EXISTS);
            } else {
                self._query(sql, (result) => {
                    if (result && result.affectedRows === 1) {
                        callback(ERROR_SETTINGS.NO_ERROR);
                    } else {
                        callback(ERROR_SETTINGS.REGISTER_FAILED);
                    }
                });
            }
        });
    }

    /**
     * @method _createDatabaseIfNotExisting
     * @param callback
     * @private
     */
    protected _createDatabaseIfNotExisting(callback) {
        const self = this;
        const sql = 'CREATE DATABASE IF NOT EXISTS ' + ExtraSettings.database;
        this.conn.query(sql, (err, result) => {
            if (err) {
                throw err;
            }
            self.log("Database Exists/Created!");

            self.conn.query('USE ' + ExtraSettings.database);
            callback();
        });
    }

    /**
     * @method _createTable
     * @param sql {string}
     * @param callback {function}
     * @private
     */
    protected _createTable(sql, callback) {
        let self = this;
        this.conn.query(sql, function (err, result) {
            if (err) {
                throw err;
            }
            self.log("Table created");

            callback();
        });
    }

    /**
     * @method _createTables
     * @private
     */
    protected _createTables() {
        let tableCounts = 0;
        const self = this;

        DATABASE_SETTINGS.tables.forEach((table) => {
            this.log('-----------------------------------------------');
            let sql = 'CREATE TABLE IF NOT EXISTS ' + ExtraSettings.database + '.' + table.name + ' (';
            table.fields.forEach((field, index) => {
                sql += field.name + ' ' + field.definition + (index !== table.fields.length - 1 ? ',' : '');
            });
            sql += ')';

            self.log(sql);
            self.conn.query(sql, (err) => {
                if (err) {
                    throw err;
                }
                self._createTable(sql, () => {
                    tableCounts++;
                    if (tableCounts === DATABASE_SETTINGS.tables.length) {
                        self.log('All tables created!');

                        self._addMember(ExtraSettings.superAdmin, (result) => {
                            if (result.error === 0) {
                                self.log('Super admin created!');
                                DataService.Ready = true;
                                DataService.InitializedEmitter.emit('onDatabaseReady');
                            } else {
                                throw('Failed create super admin!');
                            }
                        });
                    }
                });
            });
        });
    }

    /**
     * @method _userNameExists
     * @param userName {string}
     * @param callback {function}
     * @private
     */
    protected _userNameExists(userName, callback) {
        const sql = 'SELECT * FROM ' + ExtraSettings.database + '.users WHERE userName = "' + userName + '"';
        this._query(sql, (result) => {
            callback(!!result.length);
        });
    }

    /**
     * @method _getUserInfo
     * @param cred {object}
     * @param callback {function}
     * @private
     */
    protected _getUserInfo(cred, callback) {
        const sql = 'SELECT * FROM ' + ExtraSettings.database + '.users WHERE userName = "' + cred.userName + '" AND password = "' + cred.password + '"';

        this._query(sql, (result) => {
            if (result.length) {
                callback(result[0]);
            } else {
                callback(null);
            }
        });
    }

    /**
     * @method _parseToken
     * @param token
     * @returns {{userName: string; password: string}}
     * @private
     */
    protected _parseToken(token) {
        const buf = new Buffer(token, 'base64'),
            plain_auth = buf.toString(),
            creds = plain_auth.split(':');
        return {
            userName: creds[0],
            password: creds[1]
        };
    }

    /**
     * @method _getUserInfoByToken
     * @param token {string}
     * @param callback {function}
     * @private
     */
    protected _getUserInfoByToken(token, callback) {
        const cred = this._parseToken(token);

        this._getUserInfo(cred, callback);
    }

    protected _getResourceTextByKeyAndLang(key, lang, callback) {
        const sql = 'SELECT * FROM ' + ExtraSettings.database + '.resourcestext WHERE resourceKey="' + key + '" AND language ="' + lang + '"';
        this._query(sql, callback);
    }


    /**
     * @method authUser
     * @param auth {string}
     * @param callback {function}
     */
    authUser(auth, callback) {
        if (!auth || auth.indexOf('Basic') !== 0) {
            callback(ERROR_SETTINGS.INVALID_USER);
        } else {
            const self = this;
            const tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
            this._getUserInfoByToken(tmp[1], (result) => {
                if (result) {
                    callback(ERROR_SETTINGS.NO_ERROR);
                } else {
                    self.log('authUser ...');
                    callback(ERROR_SETTINGS.INVALID_USER);
                }
            });
        }
    }

    /**
     * @method getUserBasicInfo
     * @param cred {string}
     * @param callback {function}
     */
    getUserBasicInfo(cred, callback) {
        const self = this;
        this._getUserInfo(cred, (result) => {
            self.log('getUserBasicInfo ...' + result);
            if (result) {
                const token = new Buffer((cred.userName + ':' + cred.password)).toString('base64');
                const info = CommonService.ExtendObject(CommonService.CloneObject(ERROR_SETTINGS.NO_ERROR), {userInfo: result});
                info.token = token;
                info.userInfo.password = '';
                callback(info);
            } else {
                self.log('getUserBasicInfo ...');
                callback(ERROR_SETTINGS.INVALID_USER);
            }
        });
    }


    /**
     * @method registerUser
     * @param cred {string}
     * @param callback {function}
     */
    registerUser(cred, callback) {
        this._getUserInfoByToken(cred.token, (info) => {
            if (info && info.level === USER_LEVEL.SYS_ADMIN) {
                this._addMember(cred, callback);
            } else {
                callback(ERROR_SETTINGS.REGISTER_REFUSED);
            }
        })
    }

    /**
     * @method addResourceText
     * @param data {object}
     * @param callback {function}
     */
    addResourceText(data, callback) {
        const self = this;

        this._verifyToken(data.token, (result) => {
            if (result.error) {
                // not exits or error
                callback(result);
            } else {
                const userId = result.userInfo.id;
                self._getResourceTextByKeyAndLang(data.resourceKey, data.language, (result) => {
                    if (result.length) {
                        callback(ERROR_SETTINGS.KEY_EXISTS);
                        return;
                    }

                    // excape ' and " in content and comments, in other files, should not exist ' and "
                    let content = data.content.replace(/\'/g, '\\\'');
                    content = data.content.replace(/"/g, '\\"');
                    let comments = data.comments.replace(/\'/g, '\\\'');
                    comments = data.comments.replace(/"/g, '\\"');

                    const sql = 'INSERT INTO ' + ExtraSettings.database + '.resourcestext ' +
                        '(resourceType, resourceKey, language, content, createdBy, createdOn, lastEditedBy, lastEditedOn, comments) VALUES("' +
                        data.resourceType + '", "' + data.resourceKey + '", "' + data.language + '", "' + content + '", ' + userId + ', ' +
                        Date.now() + ', ' + userId + ', ' + Date.now() + ', "' + comments + '")';

                    // TODO: handle possible errors!!! _query return [] or ???
                    this._query(sql, (result) => {
                        callback(ERROR_SETTINGS.NO_ERROR);
                    });
                });
            }
        });
    }

    /**
     *
     */
    removeResourceTextByKey(data, callback) {
        const self = this;

        this._verifyToken(cred.token, (result) => {
            if (result.error) {
                // not exits or error
                callback(result);
            } else {
                const sql = 'DELETE FROM ' + ExtraSettings.database + '.resourcestext WHERE resourceKey = "' + data.resourceKey + '"';

                self._query(sql, (result) => {
                    callback(ERROR_SETTINGS.NO_ERROR);
                });
            }
        });
    }

    changeResourceTextKey(data, callback) {
        const self = this;

        this._verifyToken(cred.token, (result) => {
            if (result.error) {
                // not exits or error
                callback(result);
            } else {
                self.getResourceTextByKey(data, (result) => {
                    if (result.error) {
                        // not found the record by the key, ok to go ahead. Should validate key in the front-end, only alpha, number, _ allowed
                        const sql = 'UPDATE ' + ExtraSettings.database + '.resourcestext SET resourceKey ="' + data.newKey + '" WHERE resourceKey = "' + data.resourceKey + '"';
                        self._query(sql, (result) => {
                            callback(ERROR_SETTINGS.NO_ERROR);
                        });
                    } else {
                        callback(ERROR_SETTINGS.KEY_EXISTS);
                    }
                });
            }
        });
    }

// for the same key, there should be two records for ZH and EN
    getResourceTextByKey(data, callback) {
        const self = this;

        this._verifyToken(cred.token, (result) => {
            if (result.error) {
                // not exits or error
                callback(result);
            } else {
                let sql = 'SELECT * FROM ' + ExtraSettings.database + '.resourcestext WHERE resourceKey = "' + data.resourceKey + '"';
                self._query(sql, (result) => {
                    if (result.length) {
                        // found the records, return them.
                        callback(CommonService.ExtendObject(CommonService.CloneObject(ERROR_SETTINGS.NO_ERROR), {result: result}));
                    } else {
                        callback(ERROR_SETTINGS.NO_SUCH_KEY);
                    }
                });
            }
        });
    }

    getAllResourceText(cred, callback) {
        const self = this;

        this._verifyToken(cred.token, (result) => {
            if (result.error) {
                // not exits or error
                callback(result);
            } else {
                let sql = 'SELECT * FROM ' + ExtraSettings.database + '.resourcestext';
                self._query(sql, callback);
            }
        });
    }

    getAllResourceTextLang(cred, lang, callback) {
        const self = this;

        this._verifyToken(cred.token, (result) => {
            if (result.error) {
                // not exits or error
                callback(result);
            } else {
                let sql = 'SELECT * FROM ' + ExtraSettings.database + '.resourcestext WHERE language ="' + lang + '"';
                self._query(sql, callback);
            }
        });
    }
};
