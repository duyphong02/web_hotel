var mongoose = require("mongoose");
var ReservationSchema = mongoose.Schema({
  roomNumber: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "room",
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "users",
  },
  checkIn: {
    type: Date,
  },
  checkOut: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["pending", "using", "cancel"],
  },
  totalPrice: {
    type: Number,
  },
});
var ReservationModel = mongoose.model(
  "reservation",
  ReservationSchema,
  "reservation"
);
module.exports = ReservationModel;
