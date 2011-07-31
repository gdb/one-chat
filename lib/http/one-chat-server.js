var db = require('../db');
var middleware = require('./middleware');
var utils = require('./utils');

// HTTP
var express = require('express');
var app = express.createServer();
app.use(express.bodyParser());
app.use(middleware.process);
app.use(middleware.authenticate);

app.get('/rooms.:format?', function (req, res) {
  var rooms = db.Room.find({}, function (err, rooms) {
    var descriptions = rooms.map(function (room) {
      return room.campfire_describe();
    });
    var msg = { 'rooms': descriptions };
    respondWithJSON(res, msg);
  })
});

app.post('/rooms.:format?', function (req, res) {
  if (!enforceValidParams(req, res, { name: String,
				      topic: String }))
    return;

  var room = new db.Room();
  room.name = req.body.name,
  room.topic = req.body.topic;
  room.created_at = new Date();
  room.updated_at = new Date();

  // TODO: ensure unique
  room.campfire_id = randInt(100000);
  room.campfire_locked = false;

  room.save(function(err) {
    if (err)
      utils.errorWithJSON(res, 'Could not create room: ' + err);
    else
      utils.respondWithJSON(res, room.campfire_describe());
  });
});

app.post('/room/:id/join.:format?', middleware.loginRequired, function (req, res) {
  if (!enforceValidParams(req, res, {}))
    return;

  db.Room.findOne({ campfire_id : req.params.id }, function (err, room) {
    if (err)
      return utils.errorWithJSON(res, 'Could not find room: ' + err);

    utils.respondWithJSON(res, room.campfire_describe());
  });
});

app.listen(3000);
