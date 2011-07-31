var db = require("../db");
var utils = require("./utils");

function process(req, res, next) {
  utils.logRequest(req);
  if (!utils.enforceSupportedRequest(req, res))
    return;
  req.env = {}
  return next();
}

// Based off http://node-js.ru/3-writing-express-middleware
function authenticate (req, res, next) {
  if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0) {
    var usernameAndPassword = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString().split(':');
    if (usernameAndPassword.length == 2) {
      var username = usernameAndPassword[0];
      var password = usernameAndPassword[1];
      db.APIKey.findOne({ token : username }, function (err, api_key) {
	if (err) {
	  utils.errorWithJSON(res, err);
	} else if (!api_key) {
	  console.log('Could not find ' + username);
	  utils.errorWithJSON(res, { error: 'Invalid API key: ' + username });
	} else {
	  console.log("Authenticated " + api_key);
	  db.User.findOne({ _id : api_key.user_id }, function (err, user) {
	    if (err) {
	      utils.errorWithJSON(res, err);
	    } else {
	      req.env.user = user;
	      next();
	    }
	  });
	}
      });
    } else {
      utils.errorWithJSON(res, { error: 'Malformed Authorization header' });
    }
  } else {
    next();
  }
}

function loginRequired (req, res, next) {
  if (!req.env.user) {
    res.header('WWW-Authenticate', 'Basic realm="Campfire interface to OneChat"');
    res.send('Authentication required', 401);
  } else {
    next();
  }
}

function loginBanned (req, res, next) {
  if (req.env.user)
    utils.errorWithJSON({ error: 'Not allowed to be authenticated' });
  else
    next();
}

exports.process = process;
exports.authenticate = authenticate;
exports.loginRequired = loginRequired;
exports.loginBanned = loginBanned;
