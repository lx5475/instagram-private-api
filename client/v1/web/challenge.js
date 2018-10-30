// var _ = require("lodash");
// var errors = require('request-promise/errors');
// var Promise = require('bluebird');
// var util = require('util');

// var Session = require('../session');
// var routes = require('../routes');
// var CONSTANTS = require('../constants');
// var WebRequest = require('./web-request');
// var Request = require('../request');
// var Helpers = require('../../../helpers');
// var Exceptions = require("../exceptions");
// var ORIGIN = CONSTANTS.WEBHOST.slice(0, -1); // Trailing / in origin

// // iPhone probably works best, even from android previosly done request
// var iPhoneUserAgent = 'Instagram 19.0.0.27.91 (iPhone6,1; iPhone OS 9_3_1; en_US; en; scale=2.00; gamut=normal; 640x1136) AppleWebKit/420+';
// var iPhoneUserAgentHtml = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_3_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13E238 Instagram 10.28.0 (iPhone6,1; iPhone OS 9_3_1; en_US; en; scale=2.00; gamut=normal; 640x1136)'

// var EMAIL_FIELD_REGEXP = /email.*value(.*)"/i;
// var PHONE_FIELD_REGEXP = /sms.*value(.*)"/i;
// var PHONE_ENTERED_FIELD_REGEXP = /tel.*value="(\+\d+)"/i
// var RESET_FIELD_REGEXP = /reset_progress_form.*action="\/(.*)"/i
// var SHARED_JSON_REGEXP = /window._sharedData = (.*);<\/script>/i

// var Challenge = function(session, type, error, json) {
//     this._json = json;
//     this._session = session;
//     this._type = type;
//     this._error = error;
//     this.apiUrl = 'https://i.instagram.com/api/v1'+error.json.challenge.api_path;
// };
// //WARNING: This is NOT backward compatible code since most methods are not needed anymore. But you are free to make it backward compatible :)
// //How does it works now?
// //Well, we have two ways of resolving challange. Native and html versions.
// //First of all we reset the challenge. Just to make sure we start from beginning;
// //After if we check if we can use native api version. If not - using html;
// //Selecting method and sending code is diffenent, depending on native or html style.
// //As soon as we got the code we can confirm it using Native version.
// //Oh, and code confirm is same now for email and phone checkpoints
// Challenge.resolve = function(checkpointError,defaultMethod,skipResetStep){
//     var that = this;
//     checkpointError = checkpointError instanceof Exceptions.CheckpointError ? checkpointError : checkpointError.json;
//     if(!this.apiUrl) this.apiUrl = 'https://i.instagram.com/api/v1'+checkpointError.json.challenge.api_path;
//     if(typeof defaultMethod==='undefined') defaultMethod = 'email';
//     if(!(checkpointError instanceof Exceptions.CheckpointError)) throw new Error("`Challenge.resolve` method must get exception (type of `CheckpointError`) as a first argument");
//     if(['email','phone'].indexOf(defaultMethod)==-1) throw new Error('Invalid default method');
//     var session = checkpointError.session;

//     return new Promise(function(res,rej){
//         if(skipResetStep) return res();
//         return res(that.reset(checkpointError))
//     })
//     .then(function() {
//         return new WebRequest(session)
//             .setMethod('GET')
//             .setUrl(that.apiUrl)
//             .setHeaders({
//                 'User-Agent': iPhoneUserAgent
//             })
//             .send({followRedirect: true})
//         })
//         .catch(errors.StatusCodeError, function(error){
//             return error.response;
//         })
//         .then(function(response){
//             try{
//                 var json = JSON.parse(response.body);
//             }catch(e){
//                 if(response.body.indexOf('url=instagram://checkpoint/dismiss')!=-1) throw new Exceptions.NoChallengeRequired;
//                 console.error('[감지] INVALID RESPONSE resolve = = = = = = = = = ');
//                 console.error(response.body);
//                 // meta http-equiv="refresh" content="0; url=instagram://checkpoint/dismiss" />
//                 console.error(' = = = = = = = = = = = = = = = = = = = = = = = = = ');
//                 throw new TypeError('Invalid response. JSON expected');
//             }
//             //Using html unlock if native is not supported
//         if(json.challenge && json.challenge.native_flow===false) return that.resolveHtml(checkpointError,defaultMethod)
//         //Challenge is not required
//         if(json.status==='ok' && json.action==='close') throw new Exceptions.NoChallengeRequired;

//         //Using API-version of challenge
//         switch(json.step_name){
//             case 'select_verify_method':{
//                 return new WebRequest(session)
//                     .setMethod('POST')
//                     .setUrl(that.apiUrl)
//                     .setHeaders({
//                         'User-Agent': iPhoneUserAgent
//                     })
//                     .setData({
//                         "choice": defaultMethod==='email' ? 1 : 0
//                         })
//                         .send({followRedirect: true})
//                         .then(function(){
//                             return that.resolve(checkpointError,defaultMethod,true)
//                         })
//                 }
//                 case 'verify_code':
//                 case 'submit_phone':{
//                     return new PhoneVerificationChallenge(session, 'phone', checkpointError, json);
//                 }
//                 case 'verify_email':{
//                     return new EmailVerificationChallenge(session, 'email', checkpointError, json);
//                 }
//                 default: return new NotImplementedChallenge(session, json.step_name, checkpointError, json);
//             }
//         })
// }
// Challenge.resolveHtml = function(checkpointError,defaultMethod){
//     //Using html version
//     var that = this;
//     if(!(checkpointError instanceof Exceptions.CheckpointError)) throw new Error("`Challenge.resolve` method must get exception (type of `CheckpointError`) as a first argument");
//     if(['email','phone'].indexOf(defaultMethod)==-1) throw new Error('Invalid default method');
//     var session = checkpointError.session;

//     return new WebRequest(session)
//         .setMethod('GET')
//         .setUrl(checkpointError.url)
//         .setHeaders({
//             'User-Agent': iPhoneUserAgentHtml,
//             'Referer': checkpointError.url,
//         })
//         .send({followRedirect: true})
//         .catch(errors.StatusCodeError, function(error){
//             return error.response;
//         })
//         .then(parseResponse)

//     function parseResponse(response){
//         try{
//             var json,challenge,choice;
//             if(response.headers['content-type'] === 'application/json'){
//                 json = JSON.parse(response.body);
//                 challenge=json;
//             }else{
//                 json = JSON.parse(SHARED_JSON_REGEXP.exec(response.body)[1]);
//                 challenge = json.entry_data.Challenge[0];
//             }
//         }catch(e){
//             console.error('[감지] INVALID RESPONSE resolveHtml = = = = = = = = = ');
//             console.error(response.body);
//             console.error(' = = = = = = = = = = = = = = = = = = = = = = = = = ');
//             throw new TypeError('Invalid response. JSON expected');
//         }
//         if(defaultMethod=='email'){
//             choice = challenge.fields.email ? 1 : 0
//         }else if(defaultMethod=='phone'){
//             choice = challenge.fields.phone_number ? 0 : 1
//         }

//         switch(challenge.challengeType){
//             case 'SelectVerificationMethodForm':{
//                 return new WebRequest(session)
//                     .setMethod('POST')
//                     .setUrl(checkpointError.url)
//                     .setHeaders({
//                         'User-Agent': iPhoneUserAgentHtml,
//                         'Referer': checkpointError.url,
//                         'Content-Type': 'application/x-www-form-urlencoded',
//                         'X-Instagram-AJAX': 1
//                     })
//                     .setData({
//                         "choice": choice
//                     })
//                     .send({followRedirect: true})
//                     .then(function(){
//                         return that.resolveHtml(checkpointError,defaultMethod)
//                     })
//             }
//             case 'VerifyEmailCodeForm':{
//                 return new EmailVerificationChallenge(session, 'email', checkpointError, json);
//             }
//             case 'VerifySMSCodeForm':{
//                 return new PhoneVerificationChallenge(session, 'phone', checkpointError, json);
//             }
//             case 'ReviewLoginForm': {
//                             try {
//                                 return new WebRequest(session)
//                                 .setMethod('POST')
//                                 .setUrl(checkpointError.url)
//                                 .setHeaders({
//                                     'User-Agent': iPhoneUserAgentHtml,
//                                     'Referer': checkpointError.url,
//                                     'Content-Type': 'application/x-www-form-urlencoded',
//                                     'X-Instagram-AJAX': 1
//                                 })
//                                 .setBodyType('form')
//                                 .setData({
//                                     "choice": '0'
//                                 })
//                                 .send({followRedirect: false})
//                                 .then(function(response){
//                                     var json = JSON.parse(response.body);
//                                     return 'password_change_required';
//                                 });
//                             } catch (err) {
//                                 console.log(err);
//                             }
                            
//                         }
//             default: return new NotImplementedChallenge(session, challenge.challengeType, checkpointError, json);
//         }
//     }
// }
// Challenge.reset = function(checkpointError){
//     var that = this;

//     var session = checkpointError.session;

//     return new Request(session)
//         .setMethod('POST')
//         .setBodyType('form')
//         .setUrl(that.apiUrl.replace('/challenge/','/challenge/reset/'))
//         .setHeaders({
//             'User-Agent': iPhoneUserAgent
//         })
//         .signPayload()
//         .send({followRedirect: true})
//     .catch(function(error){
//         return error.response;
//     })
//     .then(function(response){
//         return that;
//     })
// }
// Challenge.prototype.code = function(code){
//     var that = this;
//     if(!code||code.length!=6) throw new Error('Invalid code provided');
//     return new WebRequest(that.session)
//         .setMethod('POST')
//         .setUrl(that.apiUrl)
//         .setHeaders({
//             'User-Agent': iPhoneUserAgent
//         })
//         .setBodyType('form')
//         .setData({
//             "security_code":code
//         })
//         .removeHeader('x-csrftoken')
//         .send({followRedirect: false})
//         .then(function(response){
//             try{
//                 var json = JSON.parse(response.body);
//             }catch(e){
//                 console.error('[감지] INVALID RESPONSE Challenge = = = = = = = = = ');
//                 console.error(response.body);
//                 console.error(' = = = = = = = = = = = = = = = = = = = = = = = = = ');
//                 throw new TypeError('Invalid response. JSON expected');
//             }
//             if(response.statusCode == 200 && json.status==='ok' && (json.action==='close' || json.location==='instagram://checkpoint/dismiss')) return true;
//             throw new Exceptions.NotPossibleToResolveChallenge('Unknown error',Exceptions.NotPossibleToResolveChallenge.CODE.UNKNOWN)
//         })
//         .catch(errors.StatusCodeError, function(error) {
//             if(error.statusCode == 400)throw new Exceptions.NotPossibleToResolveChallenge("Verification has not been accepted",Exceptions.NotPossibleToResolveChallenge.CODE.NOT_ACCEPTED);
//             throw error;
//         })
// }
// exports.Challenge = Challenge;

// Object.defineProperty(Challenge.prototype, "type", {
//     get: function() { return this._type },
//     set: function(val) {}
// });
// Object.defineProperty(Challenge.prototype, "session", {
//     get: function() { return this._session },
//     set: function(val) {}
// });
// Object.defineProperty(Challenge.prototype, "error", {
//     get: function() { return this._error },
//     set: function(val) {}
// });
// Object.defineProperty(Challenge.prototype, "json", {
//     get: function() { return this._json },
//     set: function(val) {}
// });

// var PhoneVerificationChallenge = function(session, type, checkpointError, json) {
//     this.submitPhone = json.step_name==='submit_phone';
//     Challenge.apply(this, arguments);
// }
// //Confirming phone number.
// //We need to return PhoneVerificationChallenge that can be able to request code.
// //So, if we need to submit phone number first - let's do it. If not - just return current PhoneVerificationChallenge;
// PhoneVerificationChallenge.prototype.phone = function(phone){
//     var that = this;
//     if(!this.submitPhone) return Promise.resolve(this);
//     let instaPhone = (that.json && that.json.step_data) ? that.json.step_data.phone_number : null;
//     let _phone = phone || instaPhone;
//     if(!_phone) return new Error('Invalid phone number');
//     return new WebRequest(that.session)
//         .setMethod('POST')
//         .setUrl(that.apiUrl)
//         .setHeaders({
//             'User-Agent': iPhoneUserAgent
//         })
//         .setBodyType('form')
//         .setData({
//             "phone_number": _phone
//         })
//         .removeHeader('x-csrftoken')
//         .send({followRedirect: false})
//         .then(function(response){
//             try{
//                 var json = JSON.parse(response.body);
//             }catch(e){
//                 console.error('[감지] INVALID RESPONSE PhoneVerificationChallenge = ');
//                 console.error(response.body);
//                 console.error(' = = = = = = = = = = = = = = = = = = = = = = = = = ');
//                 throw new TypeError('Invalid response. JSON expected');
//             }
//             return new PhoneVerificationChallenge(that.session, 'phone', that.error, json);
//         })
// }
// util.inherits(PhoneVerificationChallenge, Challenge);
// exports.PhoneVerificationChallenge = PhoneVerificationChallenge;

// var EmailVerificationChallenge = function(session, type, checkpointError, json) {
//     Challenge.apply(this, arguments);
// }

// util.inherits(EmailVerificationChallenge, Challenge);
// exports.EmailVerificationChallenge = EmailVerificationChallenge;

// var NotImplementedChallenge = function(session) {
//     Challenge.apply(this, arguments);
//     throw new Error("Not implemented, due to missing account for testing, please write me on email `ivan.ivan.90.90@gmail.com`")
// }
// util.inherits(NotImplementedChallenge, Challenge);
// exports.NotImplementedChallenge = NotImplementedChallenge;

var _ = require("underscore");
var errors = require('request-promise/errors');
var Promise = require('bluebird');
var util = require('util');

// iPhone probably works best, even from android previosly done request
var iPhoneUserAgent = _.template('Mozilla/5.0 (iPhone; CPU iPhone OS 9_3_3 like Mac OS X) '
    + 'AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13G34 Instagram <%= version %> '
    + '(iPhone7,2; iPhone OS 9_3_3; cs_CZ; cs-CZ; scale=2.00; 750x1334)');

var EMAIL_FIELD_REGEXP = /email.*value(.*)"/gi;

var Challenge = function(session, type, error, body) {
    this._session = session;
    this._type = type;
    this._error = error;
}

exports.Challenge = Challenge;

var Exceptions = require('../exceptions');
var Session = require('../session');
var routes = require('../routes');
var CONSTANTS = require('../constants');
var WebRequest = require('./web-request');
var Helpers = require('../../../helpers');
var Exceptions = require("../exceptions");
var ORIGIN = CONSTANTS.HOST.slice(0, -1); // Trailing / in origin


Object.defineProperty(Challenge.prototype, "type", {
    get: function() { return this._type },
    set: function(val) {}
});


Object.defineProperty(Challenge.prototype, "session", {
    get: function() { return this._session },
    set: function(val) {}
});


Object.defineProperty(Challenge.prototype, "error", {
    get: function() { return this._error },
    set: function(val) {}
});



var PhoneVerificationChallenge = function(session, type, checkpointError, body) {
    Challenge.apply(this, arguments);
    this.phoneInserted = false;
}
util.inherits(PhoneVerificationChallenge, Challenge);
exports.PhoneVerificationChallenge = PhoneVerificationChallenge;


PhoneVerificationChallenge.prototype.phone = function(phone) {
    var that = this;
    // ask for reset first to be sure we are going to submit phone
    return new WebRequest(that.session)
        .setMethod('GET')
        .setResource('challengeReset')
        .setHeaders({
            'Referer': that.error.url,
            'Origin': ORIGIN
        })
        .setHost(CONSTANTS.HOSTNAME)
        .removeHeader('x-csrftoken')
        .send({followRedirect: false})
        .catch(errors.StatusCodeError, function(error) {
            if(error.statusCode == 302)
                return error.response;
            throw error;    
        })
        .catch(Exceptions.NotFoundError, function(error) {
            return error.response;   
        })
        .then(function(response) {
            // 200 working, 302 dont need reset, 404 account challenge reset not allowed
            if(!_.contains([200, 302, 404], response.statusCode))
                throw new Exceptions.NotPossibleToResolveChallenge(
                    "Reset is not working", 
                    Exceptions.NotPossibleToResolveChallenge.CODE.RESET_NOT_WORKING
                );  
            // We got clean new challenge
            return new WebRequest(that.session)
                .setMethod('POST')
                .setUrl(that.error.url)
                .setHeaders({
                    'Referer': that.error.url,
                    'Origin': ORIGIN
                })
                .setBodyType('form')
                .setData({
                    phone_number: phone,
                    csrfmiddlewaretoken: that.session.CSRFToken
                })
                .setHost(CONSTANTS.HOSTNAME)
                .removeHeader('x-csrftoken')
                .send({followRedirect: false})
        })
        .then(function(response) {
            if(response.statusCode !== 200)
                throw new Exceptions.NotPossibleToResolveChallenge(
                    "Instagram not accpetion the number",
                    Exceptions.NotPossibleToResolveChallenge.CODE.NOT_ACCEPTING_NUMBER
                );  
            if(response.body.indexOf('incorrect') !== -1)
                throw new Exceptions.NotPossibleToResolveChallenge(
                    "Probably incorrect number",
                    Exceptions.NotPossibleToResolveChallenge.CODE.INCORRECT_NUMBER
                );
            if(response.body.indexOf('response_code') === -1)
                throw new Exceptions.NotPossibleToResolveChallenge();
            that.phoneInserted = true;    
            return that;    
        })
}


PhoneVerificationChallenge.prototype.code = function(code) {
    var that = this;
    return new WebRequest(that.session)
        .setMethod('POST')
        .setUrl(that.error.url)
        .setHeaders({
            'Host': CONSTANTS.HOSTNAME,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': ORIGIN,
            'Connection': 'keep-alive',
            'User-Agent': iPhoneUserAgent({version: that.session.device.version}),
            'Referer': that.error.url
        })
        .setBodyType('form')
        .removeHeader('x-csrftoken') // we actually sending this as post param
        .setData({
            response_code: code,
            csrfmiddlewaretoken: that.session.CSRFToken
        })
        .send({followRedirect: false})
        .then(function(response) {
            if(response.statusCode == 200 && response.body.indexOf('instagram://checkpoint/dismiss') !== -1)
                return true;
            // Must be redirected
            throw new Exceptions.NotPossibleToResolveChallenge(
                "Probably incorrect code",
                Exceptions.NotPossibleToResolveChallenge.CODE.INCORRECT_CODE
            );
        })
        .catch(errors.StatusCodeError, function(error) {
            if(error.statusCode == 302)
                return true;
            if(error.statusCode == 400)
                throw new Exceptions.NotPossibleToResolveChallenge(
                    "Verification has not been accepted",
                    Exceptions.NotPossibleToResolveChallenge.CODE.NOT_ACCEPTED
                );  
            throw error;    
        })
}


var EmailVerificationChallenge = function(session, type, checkpointError, body) {
    Challenge.apply(this, arguments);
    var verifyByEmailValue = body.match(EMAIL_FIELD_REGEXP);
    this.verifyByValue = verifyByEmailValue ? _.last(verifyByEmailValue[0].split("value")).slice(2, -1) : "Verify by Email";
}

util.inherits(EmailVerificationChallenge, Challenge);
exports.EmailVerificationChallenge = EmailVerificationChallenge;


EmailVerificationChallenge.prototype.parseCode = function(email) {
    var match = email.match(/security code is (\d*)?/);
    if(!match) throw new Exceptions.NotPossibleToResolveChallenge(
        "Unable to parse code",
        Exceptions.NotPossibleToResolveChallenge.CODE.UNABLE_TO_PARSE
    ); 
    return parseInt(match[1]);
};


EmailVerificationChallenge.prototype.reset = function() {
    return this.session.cookieStore.removeCheckpointStep()
};


EmailVerificationChallenge.prototype.email = function() {
    var that = this;
    return new WebRequest(that.session)
        .setMethod('POST')
        .setUrl(that.error.url)
        .setHeaders({
            'Referer': that.error.url,
            'Origin': ORIGIN
        })
        .setBodyType('form')
        .setHost(CONSTANTS.HOSTNAME)
        .removeHeader('x-csrftoken') // we actually sending this as post param
        .setData({
            email: that.verifyByValue,
            csrfmiddlewaretoken: that.session.CSRFToken
        })
        .send({followRedirect: false, qs: {next: 'instagram://checkpoint/dismiss'}})
        .then(function(response) {
            if(response.statusCode !== 200)
                throw new Exceptions.NotPossibleToResolveChallenge(); 
            return that;    
        })
};


EmailVerificationChallenge.prototype.code = function(code) {
    var that = this;
    if(!_.isNumber(code))
        throw new Error("Code input should be 6-digits number"); 
    return new WebRequest(this.session)
        .setMethod('POST')
        .setUrl(that.error.url)
        .setHeaders({
            'Referer': that.error.url,
            'Origin': ORIGIN
        })
        .setBodyType('form')
        .setHost(CONSTANTS.HOSTNAME)
        .removeHeader('x-csrftoken') // we actually sending this as post param
        .setData({
            response_code: code,
            csrfmiddlewaretoken: that.session.CSRFToken
        })
        .send({followRedirect: false, qs: {next: 'instagram://checkpoint/dismiss'}})
        .then(function(response) {
            if(response.statusCode !== 200 || response.body.indexOf('has been verified') === -1)
                throw new Exceptions.NotPossibleToResolveChallenge(); 
            return that;    
        })
};


EmailVerificationChallenge.prototype.confirmate = function(code) {
    var that = this;
    return new WebRequest(this.session)
        .setMethod('POST')
        .setUrl(that.error.url)
        .setHeaders({
            'Host': CONSTANTS.HOSTNAME,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': ORIGIN,
            'Connection': 'keep-alive',
            'User-Agent': iPhoneUserAgent({version: that.session.device.version}),
            'Referer': that.error.url
        })
        .setBodyType('form')
        .removeHeader('x-csrftoken') // we actually sending this as post param
        .setData({
            csrfmiddlewaretoken: that.session.CSRFToken,
            OK: 'OK'
        })
        .send({followRedirect: false, qs: {next: 'instagram://checkpoint/dismiss'}})
        .then(function(response) {
            if(response.statusCode == 200 && response.body.indexOf('instagram://checkpoint/dismiss') !== -1)
                return true;
            throw new Exceptions.NotPossibleToResolveChallenge(); 
        })
        .catch(errors.StatusCodeError, function(error) {
            if(error.statusCode == 302)
                return true;
            throw error;    
        })
};


var CaptchaVerificationChallenge = function(session) {
    Challenge.apply(this, arguments);
    throw new Error("Not implemented, due to missing account for testing, please write me on email `huttarichard@gmail.com`")
}
util.inherits(CaptchaVerificationChallenge, Challenge);
exports.CaptchaVerificationChallenge = CaptchaVerificationChallenge;



// Workflow for this is quite interesting,
// if you got an challenge to complete it is either:
// Captcha, Email verification or phone verification
// We need to figure out how to recognize each of these
// challenges in order to be able complete them.

Challenge.resolve = function(checkpointError) {
    if(!(checkpointError instanceof Exceptions.CheckpointError))
        throw new Error("`Challenge.resolve` method must get exception (type of `CheckpointError`) as a first argument");
    var session = checkpointError.session;   
    return session.cookieStore.removeCheckpointStep()
        .then(function() {
            return new WebRequest(session)
                .setMethod('GET')
                .setUrl(checkpointError.url)
                .send({followRedirect: false})
        })
        .then(function(response) {
            // This is obvious, email field is present it is email challenge
            if(response.body.indexOf('email') !== -1 && response.body.match(EMAIL_FIELD_REGEXP))
                return new EmailVerificationChallenge(session, 'email', checkpointError, response.body);
            // On the otherhand this is not. We can be stuck in challenge
            // so we need to detect if instagram require code he `texted` us
            // or phone_number field on first step will be present
            if(response.body.indexOf('phone_number') !== -1 || response.body.indexOf('code we texted you') !== -1)
                return new PhoneVerificationChallenge(session, 'phone', checkpointError, response.body);
            // For last we now that email or phone verification
            // is not required so last one dont need check, it is captcha
            return new CaptchaVerificationChallenge(session, 'capcha', checkpointError, response.body);
        })
        .catch(errors.StatusCodeError, function(error) {
            if(error.statusCode == 302)
                throw new Exceptions.NoChallengeRequired;
            throw error;    
        })
}
