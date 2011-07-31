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

function respondWithJSON(res, msg) {
  var content = JSON.stringify(msg, null, ' ')
  res.send(content);
  logResponse(res, content);
}

function errorWithJSON(res, msg) {
  // TODO: set status?
  var content = JSON.stringify(msg, null, ' ')
  res.send(content);
  logResponse(res, content);
}

function enforceSupportedRequest(req, res) {
  return true;
}

function requireParams(params) {
  return function (req, res, next) {
    // TODO: reject invalid params
    for (var param in params) {
      // TODO: validate type
      if (!(req.body && req.body[param])) {
	errorWithJSON(res, { error: 'Missing parameter ' + param });
	return;
      }
    }
    next();
  }
}

function randInt(i) {
  return Math.floor(Math.random() * i);
}

function randString(key, length) {
  key = key ? key + '_' : '';
  length = length || 10;

  var txt = key;
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < length; i++)
    txt += chars.charAt(randInt(chars.length));
  return txt;
}

exports.respondWithJSON = respondWithJSON;
exports.errorWithJSON = errorWithJSON;
exports.enforceSupportedRequest = enforceSupportedRequest;
exports.requireParams = requireParams;
exports.randInt = randInt;
exports.randString = randString;
exports.logRequest = logRequest;
exports.logResponse = logResponse;