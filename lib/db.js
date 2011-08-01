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
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
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

Room.prototype.campfireDescribe = function () {
  console.log("hmmm");
  // May want to add open_to_guests, active_token_value
  return {
    id: this.campfire_id,
    name: this.name,
    topic: this.topic,
    membership_limit: 1000,
    full: false,
    created_at: this.created_at,
    updated_at: this.updated_at,
  }
}

var UserSchema = new mongoose.Schema({
  campfire_id: { type: Number, unique: true },
  name: String,
  is_anonymous: { type: Boolean, default: true },
  is_admin: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  creator_id: String,
  email: { type: String, default: null },
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
    email: this.email,
    is_admin: this.is_admin,
    is_anonymous: this.is_anonymous,
    created_at: this.created_at,
    updated_at: this.updated_at,
  }
}

User.prototype.campfireDescribe = function (auth_token) {
  var type;
  if (this.is_admin)
    type = 'Admin';
  else if (this.is_anonymous)
    type = 'Member';
  else
    type = 'Guest';

  var description = {
    id: this.campfire_id,
    name: this.name,
    admin: !!this.is_admin,
    created_at: this.created_at,
    type: type,
    email: this.email,
    avatar_url: 'http://asset0.37img.com/global/missing/avatar.png?r=3'
  }
  if (auth_token) description['api-auth-token'] = auth_token;
  return description;
};

User.prototype.campfireAccountDescribe = function () {
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
  user_id: String,
  room_id: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
UserRoomSchema.index({ user_id : 1, room_id : 1 });
var UserRoom = mongoose.model('UserRoom', UserRoomSchema);

var APIKeySchema = new mongoose.Schema({
  user_id: String,
  token: { type: String, unique: true, index: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
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

var MessageSchema = new mongoose.Schema({
  campfire_id: Number,
  body: String,
  room_id: String,
  room_campfire_id: Number,
  user_id: String,
  user_campfire_id: Number,
  type: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
var Message = mongoose.model('Message', MessageSchema);

Message.prototype.campfireDescribe = function () {
  return {
    id: this.campfire_id,
    body: this.body,
    room_id: this.room_campfire_id,
    user_id: this.user_campfire_id,
    type: this.type,
    created_at: this.created_at
  };
};

exports.connect = connect;
exports.Room = Room;
exports.User = User;
exports.UserRoom = UserRoom;
exports.APIKey = APIKey;
exports.Message = Message;
