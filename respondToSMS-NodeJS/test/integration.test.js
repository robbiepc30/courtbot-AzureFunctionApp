require('dotenv').config();
var http = require('http');
var cookie = require('cookie');
var qs = require('querystring');
var assert = require('assert');

describe("respondToSMS-NodeJS sends correct response back to twilio", function () {
    this.timeout(5000); // increase timeout, sometimes functions are ins a sleep state... it seems
    it('for: cookie session.askedReminder=true, text=Yes', function (done) {
        var postData = qs.stringify({ Body: "Yes" });
        var cookieObj = { askedReminder: true };
        var options = getOptions(postData, cookieObj);
        var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>Sounds good. We will attempt to text you a courtesy reminder the day before your hearing date. Note that court schedules frequently change. You should always confirm your hearing date and time by going to http://courts.alaska.gov</Sms></Response>';
        var callback = function (res) {
            var response = "";
            res.on("data", function (chunk) {
                response += chunk;
            });
            res.on("end", function () {
                assert.equal(response, correctResponse);
                done();
            });
        };
        var req = http.request(options, callback);
        req.write(postData);
        req.end();
    });
    it('for: cookie session.askedReminder=true, text=No', function (done) {
        var postData = qs.stringify({ Body: "No" });
        var cookieObj = { askedReminder: true };
        var options = getOptions(postData, cookieObj);
        var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>OK. You can always go to http://courts.alaska.gov for more information about your case and contact information.</Sms></Response>';
        var callback = function (res) {
            var response = "";
            res.on("data", function (chunk) {
                response += chunk;
            });
            res.on("end", function () {
                assert.equal(response, correctResponse);
                done();
            });
        };
        var req = http.request(options, callback);
        req.write(postData);
        req.end();
    });
    it('for: cookie session.askedQueued=true, text=Yes', function (done) {
        var postData = qs.stringify({ Body: "Yes" });
        var cookieObj = { askedQueued: true };
        var options = getOptions(postData, cookieObj);
        var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>OK. We will keep checking for up to 10 days. You can always go to http://courts.alaska.gov for more information about your case and contact information.</Sms></Response>';
        var callback = function (res) {
            var response = "";
            res.on("data", function (chunk) {
                response += chunk;
            });
            res.on("end", function () {
                assert.equal(response, correctResponse);
                done();
            });
        };
        var req = http.request(options, callback);
        req.write(postData);
        req.end();
    });
    it('for: cookie session.askedQueued=true, text=No', function (done) {
        var postData = qs.stringify({ Body: "No" });
        var cookieObj = { askedQueued: true };
        var options = getOptions(postData, cookieObj);
        var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>OK. You can always go to http://courts.alaska.gov for more information about your case and contact information.</Sms></Response>';
        var callback = function (res) {
            var response = "";
            res.on("data", function (chunk) {
                response += chunk;
            });
            res.on("end", function () {
                assert.equal(response, correctResponse);
                done();
            });
        };
        var req = http.request(options, callback);
        req.write(postData);
        req.end();
    });
    // it('for: no cookie (first text from phone number, or past 4hrs from last text), text=2Shrt', function (done) {
    //     var postData = qs.stringify({ Body: "2Shrt" });
    //     var cookieObj = { askedQueued: true };
    //     var options = getOptions(postData, null);
    //     var correctResponse = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>Couldn\'t find your case. Case identifier should be 6 to 25 numbers and/or letters in length.</Sms></Response>';
    //     var callback = function (res) {
    //         var response = ""
    //         res.on("data", function (chunk) {
    //             response += chunk;
    //         });
    //         res.on("end", function () {
    //             assert.equal(response, correctResponse);
    //             done();
    //         });
    //     }
    //     var req = http.request(options, callback);
    //     req.write(postData);
    //     req.end();
    // });
});

function getOptions(data, cookieObj) {
    var cookieSerialized = cookie.serialize("session", JSON.stringify(cookieObj));
    return {
        host: process.env.FUNCTION_APP_ADDRESS,
        path: process.env.FUNCTION_APP_PATH,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(data),
            "Cookie": cookieSerialized
        }
    };
}


