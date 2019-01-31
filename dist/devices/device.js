"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Chance = require("chance");
const devices = require("./devices.json");
const builds = require("./builds.json");
const CONSTANTS = require("../v1/constants");
const _ = require("lodash");
class Device {
    constructor(props) {
        this.appUserAgentTemplate = _.template('Instagram <%= version %> Android (<%= agent %>)');
        this.webUserAgentTemplate = _.template('Mozilla/5.0 (Linux; Android <%= release %>; <%= model %> Build/<%= build %>; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/70.0.3538.110 Mobile Safari/537.36 <%= instagramAgent %>');
        this._language = 'en_US';
        this.username = props.username;
        const chance = new Chance(this.username);
        this.chance = chance;
        this.deviceString = chance.pickone(devices);
        const id = chance.string({
            pool: 'abcdefghijklmnopqrstuvwxyz0123456789',
            length: 16,
        });
        this.id = `android-${id}`;
        const deviceParts = this.deviceString.split(';');
        const [android_version, android_release] = deviceParts[0].split('/');
        const [manufacturer] = deviceParts[3].split('/');
        const model = deviceParts[4];
        this.payload = {
            android_version,
            android_release,
            manufacturer,
            model,
        };
        this.android_version = android_version;
        this.android_release = android_release;
        this.build = chance.pickone(builds);
        this.model = model;
        this.md5 = chance.string({
            pool: 'abcdefghijklmnopqrstuvwxyz0123456789',
            length: 32,
        });
    }
    get language() {
        return this._language;
    }
    set language(v) {
        this._language = v;
    }
    userAgent(version) {
        return this.appUserAgentTemplate({
            agent: [
                this.deviceString,
                this.language,
                CONSTANTS.PRIVATE_KEY.VERSION_CODE,
            ].join('; '),
            version: version || CONSTANTS.PRIVATE_KEY.APP_VERSION,
        });
    }
    userAgentWeb(version) {
        return this.webUserAgentTemplate({
            instagramAgent: this.userAgent(version),
            release: this.android_release,
            model: this.model,
            build: this.build,
        });
    }
}
exports.Device = Device;
//# sourceMappingURL=device.js.map