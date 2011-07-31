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

function enforceValidParams(req, res, params) {
  // TODO: reject invalid params
  for (var param in params) {
    // TODO: validate type
    if (!req.body[param]) {
      errorWithJSON(res, { error: 'Missing parameter ' + param });
      return false;
    }
  }
  return true;
}

// Util
function randInt(i) {
  return Math.floor(Math.random() * i);
}

exports.respondWithJSON = respondWithJSON;
exports.errorWithJSON = errorWithJSON;
exports.enforceSupportedRequest = enforceSupportedRequest;
exports.enforceValidParams = enforceValidParams;
exports.randInt = randInt;
