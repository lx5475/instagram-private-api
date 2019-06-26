"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPERIMENTS = require("./experiments.json");
exports.LOGIN_EXPERIMENTS = require("./login-experiments.json");
exports.SUPPORTED_CAPABILITIES = require("./supported-capabilities.json");
exports.APP_CREDENTIALS = {
    SIG_KEY: '937463b5272b5d60e9d20f0f8d7d192193dd95095a3ad43725d494300a5ea5fc',
    SIG_VERSION: '4',
    VERSION: '85.0.0.21.100',
    VERSION_CODE: '146536611',
    FB_ANALYTICS_APPLICATION_ID: '567067343352427',
    LANGUAGE: 'en_US',
};
exports.TLD = 'instagram.com';
exports.HOSTNAME = 'i.instagram.com';
exports.WEB_HOSTNAME = 'www.instagram.com';
exports.HOST = `https://${exports.HOSTNAME}/`;
exports.WEBHOST = `https://${exports.WEB_HOSTNAME}/`;
exports.API_ENDPOINT = `${exports.HOST}api/v1/`;
exports.HEADERS = {
    X_IG_Connection_Type: 'WIFI',
    X_IG_Capabilities: '3brTPw==',
};
//# sourceMappingURL=constants.js.map