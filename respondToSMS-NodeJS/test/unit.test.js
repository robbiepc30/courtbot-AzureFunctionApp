require('dotenv').config();
var http = require('http');
var cookie = require('cookie');
var qs = require('querystring');
var assert = require('assert');
var rewire = require('rewire'),
    index = rewire('../index');

describe("unit test...", function () {
    var isResponseYes = index.__get__("isResponseYes");
    var isResponseNo = index.__get__("isResponseNo");
    var serializeSessionToCookie = index.__get__("serializeSessionToCookie");
    var sanitizeText = index.__get__("sanitizeText");

    it("function sanitizeText strips emojis and signature lines", function (done) {
        var input = "Yes 😬😅 \n Sent from my iPhone because I want you to know that I have an iPhone";
        var result = sanitizeText(input);
        assert.equal(result, "YES");
        done();
    });

});

