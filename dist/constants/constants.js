"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPERIMENTS = require("./experiments.json");
exports.LOGIN_EXPERIMENTS = require("./login-experiments.json");
exports.SUPPORTED_CAPABILITIES = require("./supported-capabilities.json");
exports.APP_CREDENTIALS = {
    SIG_KEY: 'e0767f8a7ae9f6c1f9d3674be35d96117f0589960bf3dbd2921f020b33ca4b9f',
    SIG_VERSION: '4',
    VERSION: '100.0.0.17.129',
    VERSION_CODE: '161478673',
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