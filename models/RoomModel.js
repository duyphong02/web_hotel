var mongoose = require("mongoose");
var RoomSchema = mongoose.Schema({
  roomNumber: {
    type: Number,
    require: true,
  },
  roomType: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "roomType",
  },
  status: {
    type: String,
    enum: ["available", "unavailable"],
  },
  price: {
    type: Number,
    require: true,
    min: [0, "Prices do not have negative numbers"],
    max: 100,
  },
  utilities: {
    type: String,
  },
});
var RoomModel = mongoose.model("room", RoomSchema, "room");
module.exports = RoomModel;
