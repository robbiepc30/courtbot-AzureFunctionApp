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
    var text = formValues.Body;

    // Is this a response to a queue-triggered SMS? If so, "session" is stored in queue record
    // this needs to be refactored so it is more readable... TODO...
    if (isResponseYes(text) || isResponseNo(text) && !(req.session.askedQueued || req.session.askedReminder)) {
        context.log("lookup phone # in queued database table and add info to session var");
        // if no info is found in database nothing gets added to the session var
    }

    // If found a citation from a previous text... check the response for yes
    //      if yes add reminder to database and text info about reminder
    //      if no (or anything besides yes) text info about where they can find more information
    if (req.session.askedReminder) {
        context.log("has req.session.askedReminder")
        if (isResponseYes(text)) {
            context.log("has req.session.askedReminder and texted Yes")
            // db.addReminder({
            //     caseId: req.session.match.id,
            //     phone: req.body.From,
            //     originalCase: JSON.stringify(req.session.match)
            // }, function (err, data) {
            //     if (err) {
            //         rollbar.handleError(err, req);
            //     }
            // });

            // twiml.sms('Sounds good. We will attempt to text you a courtesy reminder the day before your hearing date. Note that court schedules frequently change. You should always confirm your hearing date and time by going to ' + process.env.COURT_PUBLIC_URL);
            // req.session.askedReminder = false;
            // res.send(twiml.toString());
        }
        else {
            context.log("has req.session.askedQueued and did NOT answer yes")
            // twiml.sms('OK. You can always go to ' + process.env.COURT_PUBLIC_URL + ' for more information about your case and contact information.');
            // req.session.askedReminder = false;
            // res.send(twiml.toString());
        }
        context.done(null, res);
    }

    // If did not find a citation from a previous text... check the response for yes previouse text searched for a citation but did not finddid not find citation but gave an option to send reminder if citation shows up later...
    if (req.session.askedQueued) {
        context.log("has req.session.askedQueued")
        if (isResponseYes(text)) {
            context.log("has req.session.askedQueued and texted Yes")
            // db.addQueued({
            //     citationId: req.session.citationId,
            //     phone: req.body.From
            // }, function (err, data) {
            //     if (err) {
            //         next(err);
            //     }
            //     twiml.sms('OK. We will keep checking for up to ' + process.env.QUEUE_TTL_DAYS + ' days. You can always go to ' + process.env.COURT_PUBLIC_URL + ' for more information about your case and contact information.');
            //     req.session.askedQueued = false;
            //     res.send(twiml.toString());
            // });
        }
        else {
            context.log("has req.session.askedQueued and did NOT answer yes")
            // twiml.sms('OK. You can always go to ' + process.env.COURT_PUBLIC_URL + ' for more information about your case and contact information.');
            // req.session.askedQueued = false;
            // res.send(twiml.toString());
        }
        context.done(null, res);
    }

    // First text from number, lookup citation and send response based on results
    Context.log("First text from phone number");
    // db.findCitation(text, function (err, results) {
    //     // If we can't find the case, or find more than one case with the citation
    //     // number, give an error and recommend they call in.
    //     if (!results || results.length === 0 || results.length > 1) {
    //         var correctLengthCitation = 6 <= text.length && text.length <= 25;
    //         if (correctLengthCitation) {
    //             twiml.sms('Could not find a case with that number. It can take several days for a case to appear in our system. Would you like us to keep checking for the next ' + process.env.QUEUE_TTL_DAYS + ' days and text you if we find it? (reply YES or NO)');

    //             req.session.askedQueued = true;
    //             req.session.citationId = text;
    //         } else {
    //             twiml.sms('Couldn\'t find your case. Case identifier should be 6 to 25 numbers and/or letters in length.');
    //         }
    //     } else {
    //         var match = results[0];
    //         var name = cleanupName(match.defendant);
    //         var datetime = dates.fromUtc(match.date);

    //         twiml.sms('Found a case for ' + name + ' scheduled on ' + datetime.format("ddd, MMM Do") + ' at ' + datetime.format("h:mm A") + ', at ' + match.room + '. Would you like a courtesy reminder the day before? (reply YES or NO)');

    //         req.session.match = match;
    //         req.session.askedReminder = true;
    //     }


    //     res.send(twiml.toString());
    // });

    twiml.message('You said: ' + formValues.Body);

    //var encryptSessionString = encrypt(JSON.stringify(req.session));
    // var setCookie = cookie.serialize("session", encryptSessionString, {
    //     secure: true
    // });
    var sessionString = JSON.stringify(req.session);
    var setCookie = cookie.serialize("session", sessionString, {
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
        // var decryptCookie = decrypt(cookies.session);
        // context.log("session cookie : " + decryptCookie);

        // cookieSession = JSON.parse(decryptCookie);
        context.log("session cookie : " + cookies.session);
        cookieSession = JSON.parse(cookies.session);
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

