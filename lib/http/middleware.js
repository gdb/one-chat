var utils = require("./utils");

function logRequest(req) {
  var method = req.method;
  var url = req.url;
  var query = JSON.stringify(req.query);
  var params = JSON.stringify(req.body);
  var hdrs = JSON.stringify(req.headers);

  var log = method + ' ' + url + ' ' + hdrs;
  if (params) log += ' / ' + params
  console.log(log);
}

function logResponse(res, content) {
  var log = '  Response: ' + JSON.stringify(res._header) +
    ', and content ' + JSON.stringify(content);
  console.log(log);
}

function process(req, res, next) {
  logRequest(req);
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
      db.User.findOne({ token : username }, function (err, user) {
	if (err) {
	  utils.errorWithJSON(res, err);
	} else if (!user) {
	  console.log('Could not find ' + username);
	  utils.errorWithJSON(res, { error: 'Invalid API key: ' + username });
	} else {
	  console.log("Authenticated " + user)
	  req.env.user = user
	  next();
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

exports.process = process;
exports.authenticate = authenticate;
exports.loginRequired = loginRequired;
