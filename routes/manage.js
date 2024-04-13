var express = require("express");
var router = express.Router();
const roomModel = require("../models/RoomModel");
const roomTypeModel = require("../models/RoomTypeModel");
const reservationModel = require("../models/ReservationModel");
const userModel = require("../models/UserModel");
const handlebars = require("hbs");
var dateFormat = require("handlebars-dateformat");

handlebars.registerHelper("dateFormat", dateFormat);
handlebars.registerHelper("eq", function (value1, value2) {
  return value1 === value2;
});

router.get("/", async (req, res) => {
  //tổng số phòng và thể loại
  var romType = await roomTypeModel.find({});
  var room = await roomModel.find({});
  var reservation = await reservationModel.find({});
  var totalRoomType = romType.length;
  var totalRoom = room.length;
  var totalReservation = reservation.length;
  res.render("manage/home", {
    totalRoomType,
    totalRoom,
    totalReservation,
    layout: "manage_layout",
  });
});

//Manage room
router.get("/rooms", async (req, res) => {
  try {
    var rooms = await roomModel.find({}).populate("roomType");
    var romType = await roomTypeModel.find({});
    res.render("manage/rooms", { romType, rooms, layout: "manage_layout" });
  } catch (err) {
    console.log("Error: " + err);
  }
});

router.post("/rooms", async (req, res) => {
  try {
    var roomNumber = req.body.roomNumber;
    var roomType = req.body.roomType;
    var price = req.body.price;
    var utilities = req.body.utilities;
    if (!roomNumber || !roomType || !price || !utilities) {
      throw new Error("Please enter all fields");
    } else if (price < 0) {
      throw new Error("Price cannot be negative");
    } else {
      var newRoom = {
        roomNumber,
        roomType,
        status: "unavailable",
        price,
        utilities,
      };
      await roomModel.create(newRoom);
      res.redirect("/manage/rooms");
    }
  } catch (err) {
    res.render("manage/rooms", { error: err.message, layout: "manage_layout" });
  }
});

router.get("/rooms/delete/:id", async (req, res) => {
  try {
    var id = req.params.id;
    await roomModel.findByIdAndDelete(id);
    res.redirect("/manage/rooms");
    console.log("Delete succed !");
  } catch (err) {
    console.log("Load data failed !" + err);
  }
});

router.get("/editRoom/:id", async (req, res) => {
  var id = req.params.id;
  var room = await roomModel.findById(id);
  var roomType = await roomTypeModel.find({});
  res.render("manage/editRoom", { room, roomType, layout: "manage_layout" });
});

router.post("/editRoom/", async (req, res) => {
  try {
    var id = req.body.id;
    var roomNumber = req.body.roomNumber;
    var roomType = req.body.roomType;
    var status = req.body.status;
    var price = req.body.price;
    var utilities = req.body.utilities;
    var updateRoom = {
      roomNumber,
      roomType,
      status,
      price,
      utilities,
    };
    await roomModel.findByIdAndUpdate(id, updateRoom);
    res.redirect("/manage/rooms");
    console.log("Edit succeeded !");
  } catch (err) {
    console.log("Edit failed !" + err);
  }
});
/////

//Manage roomType
handlebars.registerHelper("id", function (index) {
  return index + 1;
});

router.get("/romType", async (req, res) => {
  try {
    var romType = await roomTypeModel.find({});
    res.render("manage/romType", { romType, layout: "manage_layout" });
  } catch (err) {
    console.log("Error " + err);
  }
});

router.post("/romType", async (req, res) => {
  try {
    var roomName = req.body.roomName;
    var description = req.body.description;
    var maxPeople = req.body.maxPeople;
    var image = req.body.image;
    var newRoom = {
      roomName,
      description,
      maxPeople,
      image,
    };
    await roomTypeModel.create(newRoom);
    res.redirect("/manage/romType");
    console.log("Create succed !");
  } catch (err) {
    console.log("Create failed ! " + err);
  }
});

router.get("/romType/delete/:id", async (req, res) => {
  try {
    var id = req.params.id;
    await roomTypeModel.findByIdAndDelete(id);
    res.redirect("/manage/romType");
    console.log("Delete succed !");
  } catch (err) {
    console.log("Load data failed !" + err);
  }
});

router.get("/editRomType/:id", async (req, res) => {
  var id = req.params.id;
  var room = await roomTypeModel.findById(id);
  res.render("manage/editRomType", { room, layout: "manage_layout" });
});

router.post("/editRomType/", async (req, res) => {
  try {
    var id = req.body.id;
    var roomName = req.body.roomName;
    var description = req.body.description;
    var maxPeople = req.body.maxPeople;
    var image = req.body.image;
    var updateRoom = {
      roomName,
      description,
      maxPeople,
      image,
    };
    await roomTypeModel.findByIdAndUpdate(id, updateRoom);
    res.redirect("/manage/romType");
    console.log("Edit succeeded !");
  } catch (err) {
    console.log("Edit failed !" + err);
  }
});
//////

//Manage reservation
router.get("/reservations", async (req, res) => {
  try {
    const reservation = await reservationModel
      .find({})
      .populate({ path: "roomNumber", model: "room" })
      .populate({ path: "user", model: "users" });
    res.render("manage/reservations", {
      reservation,
      layout: "manage_layout",
    });
  } catch (err) {
    console.log("Error: " + err);
  }
});

router.get("/updateReservation/:id", async (req, res) => {
  var id = req.params.id;
  var reservation = await reservationModel.findById(id);
  var room = await roomModel.findById(reservation.roomNumber);
  var user = await userModel.findById(reservation.user);
  req.session.reservation = reservation;
  req.session.room = room;
  req.session.user = user;
  res.render("manage/updateReservation", {
    reservation,
    room,
    user,
    layout: "manage_layout",
  });
});

//Done
router.post("/updateReservation/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const reservation = await reservationModel.findById(id);
    const currentDate = new Date();
    const checkInDate = new Date(reservation.checkIn);
    let newStatus;
    let roomStatus;
    if (req.body.status === "using") {
      if (
        currentDate.getDate() != checkInDate.getDate() ||
        currentDate.getMonth() != checkInDate.getMonth() ||
        currentDate.getFullYear() != checkInDate.getFullYear()
      ) {
        throw new Error("Cannot set using before check-in");
      }
      newStatus = "using";
      roomStatus = "unavailable";
    } else if (req.body.status === "cancel") {
      newStatus = "cancel";
      roomStatus = "available";
    }
    await reservationModel.findByIdAndUpdate(id, {
      status: newStatus,
    });
    await roomModel.findByIdAndUpdate(reservation.roomNumber, {
      status: roomStatus,
    });
    res.redirect("/manage/reservations");
    console.log("Update succeeded !");
  } catch (err) {
    var room = req.session.room;
    var user = req.session.user;
    res.render("manage/updateReservation", {
      room,
      user,
      error: err.message,
      layout: "manage_layout",
    });
  }
});

module.exports = router;
