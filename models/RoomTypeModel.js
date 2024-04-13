var mongoose = require("mongoose");
var RoomTypeSchema = mongoose.Schema({
  roomName: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
  maxPeople: {
    type: Number,
    require: true,
    min: [1, "Enter the maximum number of people as 1-5"],
    max: 5,
  },
  image: {
    type: String,
  },
});
var RoomTypeModel = mongoose.model("roomType", RoomTypeSchema, "roomType");
module.exports = RoomTypeModel;
