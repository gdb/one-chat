// TODO: figure out when to require login

var db = require('../db');
var middleware = require('./middleware');
var utils = require('./utils');

var express = require('express');
var app = express.createServer();
app.use(express.bodyParser());
app.use(middleware.process);
app.use(middleware.authenticate);

// == Rooms API ==

app.post('/users.:format?', utils.requireParams({ name : String }), function (req, res) {
  // Create a new anonymous user token
  var user = new db.User();
  user.campfire_id = utils.randInt(100000);
  user.name = req.params.name;
  user.creator_id = req.env.user ? req.env.user._id : null;
  user.email = req.body.email ? req.body.email : null;
  user.save(function (err) {

  console.log("hmm");
    if (err) return utils.errorWithJSON(res, { error: 'Could not create user: ' + err });

    var key = new db.APIKey();
    key.user_id = user._id;
    key.token = utils.randString('ak', 17);
    key.save(function (err) {
      if (err) return utils.errorWithJSON(res, { error: 'Could not create API key for user: ' + err });

      utils.respondWithJSON(res, { user: user.describe(), api_key: key.describe() } );
    });
  });
});

app.get('/rooms.:format?', function (req, res) {
  var rooms = db.Room.find({}, function (err, rooms) {
    var descriptions = rooms.map(function (room) {
      return room.campfireDescribe();
    });
    var msg = { 'rooms': descriptions };
    utils.respondWithJSON(res, msg);
  })
});

app.post('/rooms.:format?',
	 utils.requireParams({ name: String, topic: String }),
	 function (req, res) {
  var room = new db.Room();
  room.name = req.body.name,
  room.topic = req.body.topic;

  // TODO: ensure unique
  room.campfire_id = utils.randInt(100000);
  room.campfire_locked = false;

  room.save(function(err) {
    if (err)
      utils.errorWithJSON(res, { error: 'Could not create room: ' + err });
    else
      utils.respondWithJSON(res, room.campfireDescribe());
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

      var descriptions = rooms.map(function (room) { return room.campfireDescribe(); });
      utils.respondWithJSON(res, descriptions);
    });
  });
});

app.get('/room/:id.:format?', function (req, res) {
  db.Room.findOne({ campfire_id : req.params.id }, function (err, room) {
    if (err) return utils.errorWithJSON(res, 'Could not find room: ' + err);
    db.UserRoom.find({ room_id : room._id }, function (err, user_rooms) {
      if (err) return utils.errorWithJSON(res, 'Could not find user rooms: ' + err);
      var user_ids = user_rooms.map(function (ur) { return ur.user_id; });
      db.User.find({ _id : { $in : user_ids } }, function (err, users) {
	if (err) return utils.errorWithJSON(res, 'Could not find users: ' + err);
	var description = room.campfireDescribe();
	description.users = users.map(function (user) { return user.campfireDescribe() });
	utils.respondWithJSON(res, { room: description });
      });
    });
  });
});

// TODO: support file upload

app.post('/room/:id/update',
	 middleware.loginRequired,
	 function (req, res) {
  db.Room.findOne({ campfire_id : req.params.id }, function (err, room) {
    if (err) return utils.errorWithJSON(res, 'Could not find room: ' + err);

    // TODO: permissions
    room.name = req.body.name ? req.body.name : null;
    room.topic = req.body.topic ? req.body.topic : null;
    room.save(function (err) {
      if (err) return utils.errorWithJSON(res, 'Could not save room: ' + err);

      utils.respondWithJSON(res, { room: room.describe() });
    });
  });
});

// TODO: Recent messages
// TODO: Recently uploaded files
// TODO: Upload object from an upload message

app.post('/room/:id/join.:format?',
	 middleware.loginRequired,
	 function (req, res) {
  db.Room.findOne({ campfire_id : req.params.id }, function (err, room) {
    if (err) return utils.errorWithJSON(res, 'Could not find room: ' + err);

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

app.post('/room/:id/leave.:format?',
	 middleware.loginRequired,
	 function (req, res) {
  db.Room.findOne({ campfire_id : req.params.id }, function (err, room) {
    if (err) return utils.errorWithJSON(res, 'Could not find room: ' + err);

    db.UserRoom.findOne({ user_id : req.env.user._id, room_id : room._id }, function (err, ur) {
      if (err) return utils.errorWithJSON(res, 'Could not find user room: ' + err);

      ur.remove(function (err) {
	if (err) return utils.errorWithJSON(res, 'Could not delete user room: ' + err);

	utils.respondWithJSON(res, { message: 'Removed from room' });
      });
    });
  });
});

// TODO: lock
// TODO: unlock

// == Search API ==

// TODO: search

// Messages

app.post('/room/:id/speak.:format?',
	 middleware.loginRequired,
	 utils.requireParams({ body: String }),
	 function (req, res) {
  db.Room.findOne({ campfire_id : req.params.id }, function (err, room) {
    if (err) return utils.errorWithJSON(res, 'Could not find room: ' + err);

    var message = new db.Message();
    message.campfire_id = utils.randInt(100000);
    message.body = req.body.body;
    message.room_id = room._id;
    message.room_campfire_id = room.campfire_id;
    message.user_id = req.env.user._id;
    message.user_campfire_id = req.env.user.campfire_id;
    message.type = 'TextMessage';

    message.save(function (err) {
      if (err) return utils.errorWithJSON(res, 'Could not save message: ' + err);

      utils.respondWithJSON(res, { message: message.campfireDescribe() });
    });
  });
});

db.connect();
app.listen(3000);
