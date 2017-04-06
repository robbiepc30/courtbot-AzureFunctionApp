require('dotenv').config()
var http = require('http');
var cookie = require('cookie');
var qs = require('querystring');
console.log("address: " + process.env.FUNCTION_APP_ADDRESS);
console.log("path: " + process.env.FUNCTION_APP_PATH);
var postData = qs.stringify({Body: "Yes"});
var cookieObj = {askedReminder: true};
var cookieString = JSON.stringify(cookieObj);
var cookieSerialized = cookie.serialize("session", cookieString);
var options = {
    host: process.env.FUNCTION_APP_ADDRESS,
    path: process.env.FUNCTION_APP_PATH,
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
        "Cookie": cookieSerialized
    }
};

var callback = function (response) {
    var str = ""
    response.on("data", function (chunk) {
        str += chunk;
    });
    response.on("end", function () {
        console.log(str);
    });
}

var req = http.request(options, callback);
console.log("*** Sending name and address in body ***");
//console.log(bodyString);
req.write(postData);
req.end();
//console.log("FUNCTION_APP_TRIGGER " + process.env.FUNCTION_APP_TRIGGER);

