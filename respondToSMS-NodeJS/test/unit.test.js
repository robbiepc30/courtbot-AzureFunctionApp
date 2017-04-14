"use strict";
var assert = require('assert');
var rewire = require('rewire'),
    index = rewire('../index');
var azureFunction = require('../index');
var fs = require('fs');

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
    var mockRequest = JSON.parse(fs.readFileSync(__dirname + "/fixtures/request.json", "utf8"));
    // mocking context object for Azure Function to do local unit test and debugging
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

    it("for: cookie session.askedReminder=true, text=Yes", function (done) {
        var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>Sounds good. We will attempt to text you a courtesy reminder the day before your hearing date. Note that court schedules frequently change. You should always confirm your hearing date and time by going to http://courts.alaska.gov</Sms></Response>';
        var response = azureFunction(context, mockRequest);
        assert.equal(response, correctResponse);
        done();
    });

});

