'use strict';
var qs = require('querystring');
var twilio = require('twilio');
var cookie = require('cookie');
var crypto = require('crypto');
var encryptKey = "s0m3Rand0mStr!ng"; // this should be put into a config var, env var
var encryptStandard = "aes256";

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var formValues = qs.parse(req.body);
    req.session = getCookieSession(context, req);
    //context.log(formValues);
    var twiml = new twilio.TwimlResponse();
    var text =  formValues.Body;
    if (isResponseYes(text) || isResponseNo(text)) {
        context.log("Response was Yes or No : " + text);
    }

    twiml.message('You said: ' + formValues.Body);

    var encryptSessionString = encrypt(JSON.stringify(req.session))
    var setCookie = cookie.serialize("session", encryptSessionString, {
        secure: true
    });

    var res = {
        status: 200,
        body: twiml.toString(),
        headers: {
            'Content-Type': 'application/xml',
            'Set-Cookie': setCookie
        },
        isRaw: true
    };

    context.done(null, res);
};

function getCookieSession(context, req) {
    var cookies = cookie.parse(req.headers.cookie || "", {
        secure: true
    });
    var cookieSession;

    if (cookies.session) {
        context.log("session cookie found");
        var decryptCookie = decrypt(cookies.session);
        context.log("session cookie : " + decryptCookie);

        cookieSession = JSON.parse(decryptCookie);
    }
    else { // set first time cookie for Twilio 
        context.log("no cookie name found");
        cookieSession = { askQueued: false, name: "xbob" };
    }

    return cookieSession;
}

function isResponseYes(text) {
    text = text.toUpperCase().trim();
    return (text === 'YES' || text === 'YEA' || text === 'YUP' || text === 'Y');
}

function isResponseNo(text) {
    text = text.toUpperCase().trim();
    return (text === 'NO' || text === 'N');
}

function encrypt(text) {
    var cipher = crypto.createCipher(encryptStandard, encryptKey)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text) {
    var decipher = crypto.createDecipher(encryptStandard, encryptKey)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}

