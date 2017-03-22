var qs = require('querystring');
var twilio = require('twilio');
var cookie = require('cookie');
var crypto = require('crypto');
var encryptKey = "s0m3Rand0mStr!ng"; // this should be put into a config var, env var
var encryptStandard = "aes256";

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    var formValues = qs.parse(req.body);
    //context.log(formValues);
    var twiml = new twilio.TwimlResponse();
    twiml.message('You said: ' + formValues.Body);

    var session;


    var cookies = cookie.parse(req.headers.cookie || "", {
          secure: true
    });

    if (cookies.session) {
        context.log("session cookie found");
        var decryptCookie = decrypt(cookies.session)
        context.log("session cookie : " + decryptCookie);

        session = JSON.parse(decryptCookie);
    }
    else {
        context.log("no cookie name found");
        session = {askQueued: false, name: "xbob"};
    }

    var encryptSessionString = encrypt(JSON.stringify(session))
    var setCookie = cookie.serialize("session", encryptSessionString, {
        secure: true
    });

    res = {
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

function encrypt(text){
  var cipher = crypto.createCipher(encryptStandard,encryptKey)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(encryptStandard,encryptKey)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}