export const COMMON_SETTINGS = {
    Environment: 'remote',   // 'local' or 'remote'
    CLEAN_TABLES_WHEN_INIT: true   // set this to true will drop all tables!
}

export const PORT_SETTINGS = {
    httpPort: 3000,
    wsPort: 3001,
    webservice: 3003,
    database: 3306
};

export const DATABASE_SETTINGS = {
    tables: [
        {
            "name": "users",
            "fields": [
                {"name": "id", "definition": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY"},
                {"name": "level", "definition": "INT"},
                {"name": "type", "definition": "INT"},
                {"name": "name", "definition": "VARCHAR(40)"},
                {"name": "firstName", "definition": "VARCHAR(40)"},
                {"name": "lastName", "definition": "VARCHAR(40)"},
                {"name": "password", "definition": "VARCHAR(40)"},
                {"name": "dharmaName", "definition": "VARCHAR(40)"},
                {"name": "phone", "definition": "VARCHAR(20)"},
                {"name": "phone1", "definition": "VARCHAR(20)"},
                {"name": "email", "definition": "VARCHAR(254)"},
                {"name": "address", "definition": "VARCHAR(254)"}
            ]
        },
        {
            "name": "login",
            "fields": [
                {"name": "id", "definition": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY"},
                {"name": "userId", "definition": "INT"},
                {"name": "password", "definition": "VARCHAR(40) NOT NULL"}
            ]
        },
        {
            "name": "loginlogs",
            "fields": [
                {"name": "id", "definition": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY"},
                {"name": "userId", "definition": "INT"},
                {"name": "timestamp", "definition": "BIGINT"}
            ]
        },
        {
            "name": "usagetracking",
            "fields": [
                {"name": "id", "definition": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY"},
                {"name": "ip", "definition": "VARCHAR(19)"},
                {"name": "respurce", "definition": "INT"},
                {"name": "timestampStart", "definition": "BIGINT"},
                {"name": "timestampEnd", "definition": "BIGINT"}
            ]
        },
        {
            "name": "resourcestext",
            "fields": [
                {"name": "id", "definition": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY"},
                {"name": "resourceType", "definition": "VARCHAR(10)"},
                {"name": "language", "definition": "VARCHAR(2)"},
                {"name": "resourceKey", "definition": "VARCHAR(50)"},
                {"name": "content", "definition": "TEXT"},
                {"name": "createdBy", "definition": "INT"},
                {"name": "lastEditor", "definition": "INT"},
                {"name": "timestamp", "definition": "BIGINT"}
            ]
        },
        {
            "name": "resourcesmedia",
            "fields": [
                {"name": "id", "definition": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY"},
                {"name": "resourceKey", "definition": "VARCHAR(50)"},
                {"name": "type", "definition": "VARCHAR(10)"},
                {"name": "url", "definition": "VARCHAR(254)"},
                {"name": "description", "definition": "VARCHAR(254)"},
                {"name": "mediaSize", "definition": "INT"},
                {"name": "createdOn", "definition": "BIGINT"},
                {"name": "updatedOn", "definition": "BIGINT"},
                {"name": "createdby", "definition": "INT"},
                {"name": "updatedby", "definition": "INT"},
            ]
        },
        {
            "name": "resourcesmedia64base",
            "fields": [
                {"name": "id", "definition": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY"},
                {"name": "resourceKey", "definition": "VARCHAR(50)"},
                {"name": "type", "definition": "VARCHAR(10)"},
                {"name": "content", "definition": "LONGTEXT"},
                {"name": "description", "definition": "VARCHAR(254)"},
                {"name": "mediaSize", "definition": "INT"},
                {"name": "createdOn", "definition": "BIGINT"},
                {"name": "updatedOn", "definition": "BIGINT"},
                {"name": "createdby", "definition": "INT"},
                {"name": "updatedBy", "definition": "INT"},
            ]
        },
    ]
};

export enum USER_LEVEL {
    SYS_ADMIN = 1,
    EDITOR = 2,
    NORMAL = 3
}

export const LANGUAGES = ['zh', 'en'];

export const ERROR_SETTINGS = {
    NO_ERROR: {error: 0},
    NOT_READY: {error: 1, msg: 'Database is not ready.'},
    NO_SUCH_USER: {error: 2, msg: 'No such user in the database.'},
    KEY_EXISTS: {error: 3, msg: 'ResourceKey already exists.'},
    NO_SUCH_KEY: {error: 4, msg: 'Cannot find the ResourceKey + Language.'},
    INVALID_USER: {error: 5, msg: 'User is invalid.'},
    LOGIN_FAILED: {error: 6, msg: 'Login refused.'},
    REGISTER_REFUSED: {error: 7, msg: 'You don\'t have the right to register new staff.'},
    REGISTER_FAILED: {error: 8, msg: 'Failed in adding new user.'},
    INVALID_TOKEN: {error: 9, msg: 'Token is invalid.'},
    USER_NAME_EXISTS: {error: 10, msg: 'User is already taken.'},
}

export class CommonService {
    static CloneObject(obj) {
        return Object.assign({}, obj);
    }

    static ExtendObject(objDest, objSource) {
        return Object.assign(objDest, objSource);
    }

    static IsValidLang(lang) {
        return LANGUAGES.indexOf(lang) !== -1;
    }
}
