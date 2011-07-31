// DB

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/one-chat', function (e) {
  if (e) {
    console.log(e);
    process.exit(1);
  }
});

var RoomSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  created_at: Date,
  updated_at: Date,
  topic: String,
  // These exist in campfire
  // membership_limit: Number,
  campfire_id: { type: Number, unique: true },
  campfire_locked: Boolean
});
var Room = mongoose.model('Room', RoomSchema);

Room.prototype.campfire_describe = function () {
  return {
    id: this.campfire_id,
    name: this.name,
    topic: this.topic,
    membership_limit: null,
    created_at: this.created_at,
    updated_at: this.updated_at,
  }
}

var UserSchema = new mongoose.Schema({
  campfire_id: { type: Number, unique: true },
  name: String,
  created_at: Date,
  updated_at: Date
  // These exist in campfire
  // time_zone: String
  // owner_id: Integer,
  // storage: Integer,
  // plan: String,
  // subdomain: String
});
var User = mongoose.model('User', UserSchema);

User.prototype.join_room = function (room) {
  var ur = new UserRoom();
  ur.user_id = this._id;
  ur.room_id = room._id;
  return ur.save()
}

var UserRoomSchema = new mongoose.Schema({
  user_id: { type: String, unique: true }
  room_id: { type: String, unique: true }
});
var UserRoom = mongoose.model('UserRoom', UserRoomSchema);


// HTTP
function logRequest(req) {
  var method = req.method;
  var url = req.url;
  var query = JSON.stringify(req.query);
  var params = JSON.stringify(req.body);
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

// Middleware
function process(req, res, next) {
  logRequest(req);
  if (!enforceSupportedRequest(req, res))
    return;
  return next();
}

function authenticate(req, res, next) {
  if (req.user)
    console.log("hey!!");
  return next();
}

// Util
function randInt(i) {
  return Math.floor(Math.random() * i);
}

var express = require("express");
var app = express.createServer();
app.use(express.bodyParser());
app.use(process);
app.use(authenticate);

app.get('/rooms.:format?', function (req, res) {
  var rooms = Room.find({}, function (err, rooms) {
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

  var room = new Room();
  room.name = req.body.name,
  room.topic = req.body.topic;
  room.created_at = new Date();
  room.updated_at = new Date();

  // TODO: ensure unique
  room.campfire_id = randInt(100000);
  room.campfire_locked = false;

  room.save(function(err) {
    if (err)
      errorWithJSON(res, 'Could not create room: ' + err);
    else
      respondWithJSON(res, room.campfire_describe());
  });
});

app.post('/room/:id/join.:format?', function (req, res) {
  if (!enforceValidParams(req, res, {}))
    return;

  Room.findOne({ campfire_id : req.params.id }, function (err, room) {
    if (err)
      return errorWithJSON(res, 'Could not find room: ' + err);


    respondWithJSON(res, room.campfire_describe());
  });
});

app.listen(3000);
