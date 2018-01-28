import { CommonLogger } from './../logger';
import { EventEmitter } from 'events';
import { DATABASE_SETTINGS, PORT_SETTINGS, ERROR_SETTINGS, COMMON_SETTINGS, USER_LEVEL, CommonService } from './../conf/config';
import { ExtraSettings } from './../data/config.js';

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
            host: COMMON_SETTINGS.Environment === 'local' ? ExtraSettings.localHost : ExtraSettings.remoteHost,
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

            if (COMMON_SETTINGS.CLEAN_TABLES_WHEN_INIT) {
                DATABASE_SETTINGS.tables.forEach((table) => {
                    self.query('DROP TABLE IF EXISTS ' + ExtraSettings.database + '.' + table.name, null);
                });
            }

            self._createDatabaseIfNotExisting(() => {
                self.log('Database created / existing!!!');
                self._createTables();
            });
        });
    }

    protected _addNewStaff(cred, callback) {
        const sql = 'INSERT INTO ' + ExtraSettings.database + '.users (level, type, name, firstName, lastName, password, dharmaName, phone, phone1, email, address) VALUES ('+
            cred.level + ', "' + cred.type + '", "' + cred.userName + '", "' + cred.firstName + '", "' + cred.lastName + '", "' +
            cred.password + '", "' + cred.dharmaName + '", "' + cred.phone + '", "' + cred.phone1 + '", "' + cred.email + '", "' + cred.address + '")';

        this._userNameExists(cred.name,(isUserExisting) => {
            if (isUserExisting) {
                callback(ERROR_SETTINGS.USER_NAME_EXISTS);
            } else {
                this.query(sql, (result) => {
                    if (result && result.affectedRows === 1) {
                        callback(ERROR_SETTINGS.NO_ERROR);
                    } else {
                        callback(ERROR_SETTINGS.REGISTER_FAILED);
                    }
                });
            }
        });
    }

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
                    tableCounts ++;
                    if (tableCounts === DATABASE_SETTINGS.tables.length) {
                        self.log('All tables created!');

                        self._addNewStaff(ExtraSettings.superAdmin , (result) => {
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


    protected _userNameExists(userName, callback) {
        const sql = 'SELECT * FROM ' + ExtraSettings.database + '.users WHERE name = "' + userName + '"';
        this.query(sql, (result) => {
            callback(!!result.length);
        });
    }

    protected _getUserInfo(cred, callback) {
        const sql = 'SELECT * FROM ' + ExtraSettings.database + '.users WHERE name = "' + cred.username + '" AND password = "' + cred.password + '"';

        this.query(sql, (result) => {
            if (result.length) {
                callback(result[0]);
            } else {
                callback(null);
            }
        });
    }

    protected _parseToken(token) {
        const buf = new Buffer(token, 'base64'),
            plain_auth = buf.toString(),
            creds = plain_auth.split(':');
        return {
            username: creds[0],
            password: creds[1]
        };
    }

    protected _getUserInfoByToken(token, callback) {
        const cred = this._parseToken(token);

        this._getUserInfo(cred, callback);
    }

    authUser(auth, callback) {
        const tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
        this._getUserInfoByToken(tmp[1], (result) => {
            if (result) {
                callback(ERROR_SETTINGS.NO_ERROR);
            } else {
                callback(ERROR_SETTINGS.INVALID_USER);
            }
        });
    }

    getUserBasicInfo(cred, callback) {
        this._getUserInfo(cred, (result) => {
            if (result) {
                callback(CommonService.ExtendObject(CommonService.CloneObject(ERROR_SETTINGS.NO_ERROR), {id: result.id, level: result.level, token: new Buffer((cred.username + ':' + cred.password)).toString('base64')}));
            } else {
                callback(ERROR_SETTINGS.INVALID_USER);
            }
        });
    }

    registerUser(cred, callback) {
        this._getUserInfoByToken(cred.token, (info) => {
            if (info && info.level === USER_LEVEL.SYS_ADMIN) {
                this._addNewStaff(cred, callback);
            } else {
                callback(ERROR_SETTINGS.REGISTER_REFUSED);
            }
        })
    }

    userExists(userId, callback) {
        if (!DataService.Ready) {
            callback(ERROR_SETTINGS.NOT_READY);
        } else {
            this.getUserById(userId, (result) => {
                if (!result.length) {
                    callback(ERROR_SETTINGS.NO_SUCH_USER);
                } else {
                    callback();
                }
            });
        }
    }



    addResourceText(data, callback) {
        const self = this;

        this.userExists(data.userId, (result) => {
            if (result) {
                // not exits or error
                callback(result);
            } else {
                self.getResourceTextByKeyAndLang(data.key, data.lang, (result) => {
                    if (result.length) {
                        callback(ERROR_SETTINGS.KEY_EXISTS);
                        return;
                    }

                    // if (CommonService.IsValidLang())


                    let content = data.content.replace(/\'/g, '\\\'');
                    content = data.content.replace(/"/g, '\\"');

                    const sql = 'INSERT INTO ' + ExtraSettings.database + '.resourcestext (resourceType, resourceKey, content, createdBy, lastEditor, timestamp) VALUES("' +
                        data.type + '", "' + data.key + '", "' + content + '", ' + data.userId + ', ' + data.userId + ', ' + Date.now() + ')';

                    this.query(sql, (result) => {
                        callback(ERROR_SETTINGS.NO_ERROR);
                    });
                });
            }
        });
    }

    updateResourceText(data, callback) {
        const self = this;

        this.userExists(data.userId, (result) => {
            if (result) {
                // not exits or error
                callback(result);
            } else {
                self.getResourceTextByKeyAndLang(data.key, data.lang, (result) => {
                    if (!result.length) {
                        self.addResourceText(data, callback);
                        return;
                    }

                    let content = data.content.replace(/\'/g, '\\\'');
                    content = data.content.replace(/"/g, '\\"');

                    const sql = 'UPDATE ' + ExtraSettings.database + '.resourcestext SET resourceType = "' + data.type + '", content = "' +
                        content + '", lastEditor = ' + data.userId + ', timestamp = ' + Date.now() + ' WHERE resourceKey = "' + data.key + '"';

                    this.query(sql, (result) => {
                        callback(ERROR_SETTINGS.NO_ERROR);
                    });
                });
            }
        });
    }

    removeResourceText(data, callback) {
        const self = this;

        this.userExists(data.userId, (result) => {
            if (result) {
                // not exits or error
                callback(result);
            } else {

                self.getResourceTextByKeyAndLang(data.key, data.lang,(result) => {
                    if (!result.length) {
                        callback(ERROR_SETTINGS.NO_SUCH_KEY);
                        return;
                    }

                    const sql = 'DELETE FROM ' + ExtraSettings.database + '.resourcestext WHERE resourceKey = "' + data.key + '"';

                    this.query(sql, (result) => {
                        callback(ERROR_SETTINGS.NO_ERROR);
                    });
                });
            }
        });
    }

    changeResourceTextKey(data, callback) {
        const self = this;

        this.userExists(data.userId, (result) => {
            if (result) {
                // not exits or error
                callback(result);
            } else {

                self.getResourceTextByKeyAndLang(data.key, data.lang, (result) => {
                    if (!result.length) {
                        callback(ERROR_SETTINGS.NO_SUCH_KEY);
                        return;
                    }

                    let sql = 'SELECT * FROM ' + ExtraSettings.database + '.resourcestext WHERE resourceKey = "' + data.newKey + '"';
                    this.query(sql, (result) => {
                        if (result.length) {
                            // the new key already exists
                            callback(ERROR_SETTINGS.KEY_EXISTS);
                        } else {
                            sql = 'UPDATE ' + ExtraSettings.database + '.resourcestext SET resourceKey ="' + data.newKey + '" WHERE resourceKey = "' + data.key + '"';
                            this.query(sql, (result) => {
                                callback(ERROR_SETTINGS.NO_ERROR);
                            });
                        }
                    });
                });
            }
        });
    }

    getAllResourceText(callback) {
        let sql = 'SELECT * FROM ' + ExtraSettings.database + '.resourcestext';
        this.query(sql, callback);
    }

    query(sql, callback?) {
        this.conn.query(sql, (err, result) => {
            if (err) {
                throw err;
            }

            if (callback) {
                callback(result || []);
            }
        });
    }

    getResourceTextByKeyAndLang(key, lang, callback) {
        const sql = 'SELECT * FROM ' + ExtraSettings.database + '.resourcestext WHERE resourceKey="' + key + '" AND language ="' + lang + '"';
        this.query(sql, callback);
    }

    getResourceTextById(id, callback) {
        const sql = 'SELECT * FROM ' + ExtraSettings.database + '.resourcestext WHERE id=' + id;
        this.query(sql, callback);
    }

    getUserById(id, callback) {
        let sql = 'SELECT id FROM ' + ExtraSettings.database + '.users WHERE id=' + id;
        this.query(sql, callback);
    }

    verifyToken(token, callback) {
        const sql = 'SELECT * FROM '+ ExtraSettings.database + '.users';
        this.query(sql, (users) => {
            let found = false;
            users.forEach((user) => {
                if (token === new Buffer((user.username + ':' + user.password)).toString('base64')) {
                    found = true;
                    callback(user);
                }
            });

            if (!found) {
                callback(ERROR_SETTINGS.INVALID_TOKEN);
            }
        });
    }
};


