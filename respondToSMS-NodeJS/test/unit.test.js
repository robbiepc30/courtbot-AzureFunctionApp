var assert = require('assert');
var rewire = require('rewire'),
    index = rewire('../index');

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
        var y =  sanitizeText("y");
        var yo = sanitizeText("yo ");
        var no = sanitizeText("no ");
        var isTrue = isResponseYes(yes) && isResponseYes(yea) && isResponseYes(yup) && isResponseYes(y);
        var isFalse = !isResponseYes(yo) && !isResponseYes(no);
        assert.equal(isTrue, true);
        assert.equal(isFalse,true);
        done(); 
    });
});


