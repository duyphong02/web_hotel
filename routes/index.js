var express = require("express");
var nodemailer = require("nodemailer");
var mailGen = require("mailgen");
var roomTypeModel = require("../models/RoomTypeModel");
var roomModel = require("../models/RoomModel");
var userModel = require("../models/UserModel");
var reservationModel = require("../models/ReservationModel");
var { checkUser } = require("../middlewares/authMiddleware");
var router = express.Router();

const mailGenerator = new mailGen({
  theme: "default",
  product: {
    name: "Web TJ Hotel",
    link: "https://example.com",
    copyright: "Copyright © 2024 WEB TJ HOTEL",
  },
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: "ha29042002@gmail.com",
    pass: "qkgfmnzzbobcapky",
  },
});

// Hiển thị toàn bộ room type
router.get("/", async (req, res, next) => {
  var romType = await roomTypeModel.find({});
  res.render("index", { title: "Express", romType });
});

// Gửi email
router.get("/contact", function (req, res) {
  res.render("contact");
});

router.post("/contact", async (req, res) => {
  const message = req.body;
  let username, email;
  if (req.user) {
    username = req.user.username;
    email = req.user.email;
  } else {
    username = req.body.username;
    email = req.body.email;
  }
  try {
    var response = {
      body: {
        name: username,
        info: "Contact us",
        table: {
          data: [
            {
              Message: message,
            },
          ],
          columns: {
            customWidth: {
              Price: "15%",
            },
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };
    const mail = mailGenerator.generate(response);
    const mailOptions = {
      from: {
        name: "Web TJ Hotel",
        address: "<ha29042002@gmail.com>",
      }, // sender address
      to: email, // user's email
      subject: "Contact us", // Subject line
      html: mail, // html body
    };
    await transporter.sendMail(mailOptions);
    res.redirect("/");
  } catch (err) {
    res.redirect("/contact");
    console.log(err);
  }
});

// Hiển thị toàn bộ room
router.get("/room", async (req, res) => {
  const romType = req.query.roomTypeFilter;
  let room;
  try {
    if (!romType) {
      room = await roomModel.find({}).populate("roomType");
    } else {
      room = await roomModel.find({ roomType: romType }).populate("roomType");
    }
    const roomType = await roomTypeModel.find({});
    res.render("room", { room, roomType });
  } catch (error) {
    console.error("Error:", error);
  }
});

router.get("/room/:id", async (req, res) => {
  try {
    const roomType = req.params.id;
    const room = await roomModel
      .find({ roomType: roomType })
      .populate("roomType");
    res.render("room", { room });
  } catch (error) {
    console.error("Error:", error);
  }
});

module.exports = router;
