/* jshint node: true */
"use strict";
var assert = require('assert');
var rewire = require('rewire'),
    index = rewire('../index');
var azureFunction = require('../index');
var fs = require('fs');
var cookie = require('cookie');
var qs = require('querystring');

describe("unit test private variables", function () {
    var isResponseYes = index.__get__("isResponseYes");
    var isResponseNo = index.__get__("isResponseNo");
    var serializeSessionToCookie = index.__get__("serializeSessionToCookie");
    var sanitizeText = index.__get__("sanitizeText");
    var encrypt = index.__get__("encrypt");
    var decrypt = index.__get__("decrypt");


    it("function sanitizeText strips emojis and signature lines", function (done) {
        var input = "Yes 😬😅 \n Sent from my iPhone because I want you to know that I have an iPhone";
        var result = sanitizeText(input);
        assert.equal(result, "YES");
        done();
    });

    it("encrypt and decrypt functions encrypts and decrypts strings", function (done) {
        var input = "Hey encrypt me!";
        var enc = encrypt(input);
        var dec = decrypt(enc);
        assert.equal(dec, input);
        done();
    });

    it("serializeSessionToCookie function serializes session object to be used as a cookie", function (done) {
        var input = { askedReminder: true };
        var result = serializeSessionToCookie(input);
        var expected = "session=%7B%22askedReminder%22%3Atrue%7D; Secure";
        assert.equal(result, expected);
        done();
    });

    it("isResponseYes returns true for correct words and false for incorrect words", function (done) {
        var yes = sanitizeText(" YeS");
        var yea = sanitizeText("yeA  ");
        var yup = sanitizeText("YUP ");
        var y = sanitizeText("y");
        var yo = sanitizeText("yo ");
        var no = sanitizeText("no ");
        var isTrue = isResponseYes(yes) && isResponseYes(yea) && isResponseYes(yup) && isResponseYes(y);
        var isFalse = !isResponseYes(yo) && !isResponseYes(no);
        assert.equal(isTrue, true);
        assert.equal(isFalse, true);
        done();
    });
});

describe("respondToSMS-NodeJS sends correct response back to twilio", function () {
    // mocking context object for Azure Function to do local unit test and debugging

    it("for: cookie session.askedReminder=true, text=Yes", function (done) {
        var postData = qs.stringify({ Body: "Yes" });
        var cookieObj = { askedReminder: true };
        var cookieSerialized = cookie.serialize("session", JSON.stringify(cookieObj));
        var req = getMockRequest(postData, cookieSerialized);
        var context = getContext(req);
        var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>Sounds good. We will attempt to text you a courtesy reminder the day before your hearing date. Note that court schedules frequently change. You should always confirm your hearing date and time by going to http://courts.alaska.gov</Sms></Response>';
        var response = azureFunction(context, req);
        assert.equal(response, correctResponse);
        done();
    });

    it('for: cookie session.askedReminder=true, text=No', function (done) {
        var postData = qs.stringify({ Body: "No" });
        var cookieObj = { askedReminder: true };
        var cookieSerialized = cookie.serialize("session", JSON.stringify(cookieObj));
        var req = getMockRequest(postData, cookieSerialized);
        var context = getContext(req);
        var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>OK. You can always go to http://courts.alaska.gov for more information about your case and contact information.</Sms></Response>';
        var response = azureFunction(context, req);
        assert.equal(response, correctResponse);
        done();
    });
    it('for: cookie session.askedQueued=true, text=Yes', function (done) {
        var postData = qs.stringify({ Body: "Yes" });
        var cookieObj = { askedQueued: true };
        var cookieSerialized = cookie.serialize("session", JSON.stringify(cookieObj));
        var req = getMockRequest(postData, cookieSerialized);
        var context = getContext(req);
        var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>OK. We will keep checking for up to 10 days. You can always go to http://courts.alaska.gov for more information about your case and contact information.</Sms></Response>';
        var response = azureFunction(context, req);
        assert.equal(response, correctResponse);
        done();
    });

    it('for: cookie session.askedQueued=true, text=No', function (done) {
        var postData = qs.stringify({ Body: "No" });
        var cookieObj = { askedQueued: true };
        var cookieSerialized = cookie.serialize("session", JSON.stringify(cookieObj));
        var req = getMockRequest(postData, cookieSerialized);
        var context = getContext(req);
        var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>OK. You can always go to http://courts.alaska.gov for more information about your case and contact information.</Sms></Response>';
        var response = azureFunction(context, req);
        assert.equal(response, correctResponse);
        done();
    });

    it('for: no cookie (first text from phone number, or past 4hrs from last text), text=2Shrt', function (done) {
        var postData = qs.stringify({ Body: "2Shrt" });
        var cookieObj = null;
        var cookieSerialized = cookie.serialize("session", JSON.stringify(cookieObj));
        var req = getMockRequest(postData, cookieSerialized);
        var context = getContext(req);
        var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>Lookup up citation, still needs to be implemented (need database implementation first)</Sms></Response>';
        var response = azureFunction(context, req);
        assert.equal(response, correctResponse);
        done();
    });
});

// TODO: at some point make these into classes and refactor...
function getContext(mockRequest) {
    var context = {
        invocationId: 'ID',
        bindings: {
            mockRequest
        },
        log: function () {
            // do nothing for mocha unit test, uncomment if needed to debug.
            // var util = require('util');
            // var val = util.format.apply(null, arguments);
            // console.log(val);
        },
        done: function (err, propertyBag) {
            // done this way incase the context.res is used and then done() is called instead of calling done with the response argument.
            this.res = propertyBag;
            return this.res.body;
        },
        res: null
    };
    return context;
}

function getMockRequest(body, cookie) {
    var mockRequest = {
        "originalUrl": "http://azureFunction.azurewebsites.net/api/azureFunction?code=somerandomestring",
        "method": "POST",
        "query": {
            "code": "somerandomstring"
        },
        "headers": {
            "connection": "Keep-Alive",
            "cookie": cookie,
            "host": "azureFunction.azurewebsites.net",
            "max-forwards": "10",
            "x-liveupgrade": "1",
            "x-original-url": "/api/azureFunction?code=somerandomestring",
            "x-arr-log-id": "someID",
            "disguised-host": "azureFunction.azurewebsites.net",
            "x-site-deployment-id": "azureFunction",
            "was-default-hostname": "azureFunction.azurewebsites.net",
            "x-forwarded-for": "127.0.0.1:5500"
        },
        "body": body,
        "params": {},
        "rawBody": body
    };
    return mockRequest;
}

