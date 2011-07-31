var db = require('../db');
var middleware = require('./middleware');
var utils = require('./utils');

// HTTP
var express = require('express');
var app = express.createServer();
app.use(express.bodyParser());
app.use(middleware.process);
app.use(middleware.authenticate);

app.post('/users.:format?', utils.requireParams({ name : String }), function (req, res) {
  // Create a new anonymous user token
  var user = new db.User();
  user.campfire_id = utils.randInt(100000);
  user.name = req.params.name;
  user.is_anonymous = true;
  user.created_at = new Date();
  user.updated_at = new Date();
  user.creator_id = req.env.user ? req.env.user._id : null;
  user.save(function (err) {
  console.log("hmm");
    if (err)
      return utils.errorWithJSON(res, { error: 'Could not create user: ' + err });

    var key = new db.APIKey();
    key.user_id = user._id;
    key.token = utils.randString('ak', 17);
    key.created_at = new Date();
    key.updated_at = new Date();
    key.save(function (err) {
      if (err)
	return utils.errorWithJSON(res, { error: 'Could not create API key for user: ' + err });
      console.log("hmm");
      utils.respondWithJSON(res, { user: user.describe(), api_key: key.describe() } );
    });
  });
});

app.get('/rooms.:format?', function (req, res) {
  var rooms = db.Room.find({}, function (err, rooms) {
    var descriptions = rooms.map(function (room) {
      return room.campfire_describe();
    });
    var msg = { 'rooms': descriptions };
    respondWithJSON(res, msg);
  })
});

app.post('/rooms.:format?',
	 utils.requireParams({ name: String, topic: String }),
	 function (req, res) {
  var room = new db.Room();
  room.name = req.body.name,
  room.topic = req.body.topic;
  room.created_at = new Date();
  room.updated_at = new Date();

  // TODO: ensure unique
  room.campfire_id = utils.randInt(100000);
  room.campfire_locked = false;

  room.save(function(err) {
    if (err)
      utils.errorWithJSON(res, { error: 'Could not create room: ' + err });
    else
      utils.respondWithJSON(res, room.campfire_describe());
  });
});

app.get('/presence.:format?', middleware.loginRequired, function (req, res) {
  db.UserRoom.find({ user_id : req.env.user._id }, function (err, user_rooms) {
    if (err)
      return utils.errorWithJSON(res, { error: 'Could not find rooms: ' + err });

    var room_ids = user_rooms.map(function (user_room) { return user_room.room_id });
    db.Room.find({ _id : { $in : room_ids } }, function (err, rooms) {
      if (err)
	return utils.errorWithJSON(res, { error: 'Could not find rooms: ' + err });

      var descriptions = rooms.map(function (room) { return room.campfire_describe(); });
      utils.respondWithJSON(res, descriptions);
    });
  });
});

app.post('/room/:id/join.:format?',
	 middleware.loginRequired,
	 function (req, res) {
  db.Room.findOne({ campfire_id : req.params.id }, function (err, room) {
    if (err)
      return utils.errorWithJSON(res, 'Could not find room: ' + err);

    var ur = new db.UserRoom();
    ur.user_id = req.env.user._id;
    ur.room_id = room._id;
    ur.save(function (err) {
      if (err && !/^E11000 /.exec(err.message))
	utils.errorWithJSON(res, { error: 'Could not join room: ' + err });
      else
	utils.respondWithJSON(res, { user: req.env.user.describe(), room: room.describe() });
    });
  });
});

db.connect();
app.listen(3000);
