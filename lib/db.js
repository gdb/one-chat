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

exports.Room = Room;
exports.User = User;
exports.UserRoom = UserRoom;
exports.APIKey = APIKey;