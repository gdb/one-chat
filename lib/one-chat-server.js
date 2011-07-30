// DB

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/one-chat', function (e) {
  if (e) {
    console.log(e);
    process.exit(1);
  }
});

var RoomSchema = new mongoose.Schema({
  name : String,
  created_at : Date,
  updated_at : Date,
  topic: String,
  membership_limit: Number,
  // These exist in campfire
  campfire_id: Number,
  campfire_locked: Boolean
});
var Room = mongoose.model('Room', RoomSchema);

// HTTP
function logRequest(req) {
  var method = req.method;
  var url = req.url;
  var query = JSON.stringify(req.query);
  var params = JSON.stringify(req.params);
  var hdrs = JSON.stringify(req.headers);

  var log = method + ' ' + url + ' ' + hdrs + ' / ' + params;
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

var express = require("express");
var app = express.createServer();

app.post('/rooms.json', function(req, res){
  logRequest(req);
  var rooms = Room.find({}, function (err, docs) {
    var msg = { 'rooms': docs };
    respondWithJSON(res, msg);
  })
});

app.listen(3000);
