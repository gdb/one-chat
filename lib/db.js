var mongoose = require('mongoose');

function connect () {
  mongoose.connect('mongodb://localhost/one-chat', function (e) {
    if (e) {
      console.log(e);
      process.exit(1);
    }
  });
}

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

Room.prototype.describe = function () {
  return {
    name: this.name,
    created_at: this.created_at,
    updated_at: this.updated_at,
    topic: this.topic
  }
}

Room.prototype.campfire_describe = function () {
  return {
    id: this.campfire_id,
    name: this.name,
    topic: this.topic,
    membership_limit: 1000,
    created_at: this.created_at,
    updated_at: this.updated_at,
  }
}

var UserSchema = new mongoose.Schema({
  campfire_id: { type: Number, unique: true },
  name: String,
  is_anonymous: Boolean,
  is_admin: Boolean,
  created_at: Date,
  updated_at: Date,
  creator_id: String,
  // TODO: just do unix timestamps and have the client figure it out
  time_zone: String
  // These exist in campfire
  // time_zone: String
  // owner_id: Integer,
  // storage: Integer,
  // plan: String,
  // subdomain: String
});
var User = mongoose.model('User', UserSchema);

User.prototype.describe = function () {
  return {
    id: this.campfire_id,
    name: this.name,
    created_at: this.created_at,
    updated_at: this.updated_at,
  }
}

User.prototype.campfire_describe = function () {
  return {
    id: this.campfire_id,
    name: this.name,
    subdomain: 'mysubdomain',
    plan: 'fake',
    owner_id: 12345,
    time_zone: this.time_zone,
    storage: 0,
    created_at: this.created_at,
    updated_at: this.updated_at,
  }
}

var UserRoomSchema = new mongoose.Schema({
  user_id: { type: String, unique: true },
  room_id: { type: String, unique: true },
  created_at: Date,
  updated_at: Date
});
var UserRoom = mongoose.model('UserRoom', UserRoomSchema);

var APIKeySchema = new mongoose.Schema({
  user_id: String,
  token: { type: String, unique: true, index: true },
  created_at: Date,
  updated_at: Date
});
var APIKey = mongoose.model('APIKey', APIKeySchema);

APIKey.prototype.describe = function () {
  return {
    user_id: this.user_id,
    token: this.token,
    created_at: this.created_at,
    updated_at: this.updated_at
  }
}

exports.connect = connect;
exports.Room = Room;
exports.User = User;
exports.UserRoom = UserRoom;
exports.APIKey = APIKey;
