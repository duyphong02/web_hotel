var express = require("express");
var nodemailer = require("nodemailer");
var mailGen = require("mailgen");
var roomModel = require("../models/RoomModel");
var roomTypeModel = require("../models/RoomTypeModel");
var reservationModel = require("../models/ReservationModel");
var userModel = require("../models/UserModel");
var dateFormat = require("handlebars-dateformat");
var { checkUser } = require("../middlewares/authMiddleware");
var handlebars = require("hbs");
var paypal = require("paypal-rest-sdk");
var router = express.Router();

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AUncH_YD2g_c6taWqtpUEe8DBV754JyEOjQy5Jj0So3CeFKfB3sYb6s9QiA7AKENEYoTZsY1mRTkgZYB",
  client_secret:
    "ED5qyXYzNaOSsJuVxkuNOn5HajHzDHBFzxZurWGzbVyM2Q0F0dNveosUGVUCPX-hqCkvS_wLseyATCG-",
});

handlebars.registerHelper("dateFormat", dateFormat);

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

function totalPrice(price, checkIn, checkOut) {
  var oneDay = 24 * 60 * 60 * 1000;
  let diffDays;
  if (checkIn < checkOut) {
    diffDays = Math.round(Math.abs((checkIn - checkOut) / oneDay));
  } else {
    diffDays = Math.round(Math.abs((checkOut - checkIn) / oneDay));
  }
  var total = price * diffDays;
  return total;
}

router.get("/confirmation", checkUser, async (req, res) => {
  var user = req.user;
  if (!user) {
    res.redirect("/user/login");
  }
  res.render("reservation/confirmation");
});

router.get("/confirmation/:id", checkUser, async (req, res) => {
  try {
    var user = req.user;
    if (!user) {
      res.redirect("/user/login");
    } else {
      var roomId = req.params.id;
      var room = await roomModel.findById(roomId).populate("roomType");
      var roomType = await roomTypeModel.find({});
      req.session.roomId = roomId;
      req.session.room = room;
      req.session.roomType = roomType;
      res.render("reservation/confirmation", { room, roomType });
    }
  } catch (err) {
    console.log(err);
  }
});

//Chưa tích hợp payment
// router.post("/confirmation/:id", checkUser, async (req, res) => {
//   try {
//     var roomId = req.session.roomId;
//     var checkIn = req.body.checkIn ? new Date(req.body.checkIn) : null;
//     if (checkIn) {
//       checkIn.setHours(0, 0, 0, 0);
//     }
//     var checkOut = req.body.checkOut ? new Date(req.body.checkOut) : null;
//     var date = new Date();
//     date.setHours(0, 0, 0, 0);
//     var user = req.user;
//     var room = await roomModel.findById(roomId).populate("roomType");
//     var userId = await userModel.findById(user);
//     var total = totalPrice(room.price, checkIn, checkOut);
//     req.session.total = total;
//     console.log("Room: " + roomId);
//     console.log("User: " + user);
//     if (room.status === "unavailable") {
//       throw new Error("Room is in use");
//     } else if (!checkIn || !checkOut) {
//       throw new Error("Please select check-in and check-out dates");
//     } else if (checkIn < date) {
//       throw new Error("Check-in date must be in the future");
//     } else if (checkIn.getTime() === checkOut.getTime()) {
//       throw new Error("Same-day reservations are not possible");
//     } else if (checkOut < checkIn) {
//       throw new Error("Check-out date must be after check-in date");
//     } else {
//       var newReservation = {
//         roomNumber: roomId,
//         user: userId,
//         checkIn: checkIn,
//         checkOut: checkOut,
//         status: "pending",
//         totalPrice: total,
//       };
//     }
//     await reservationModel.create(newReservation);
//     var response = {
//       body: {
//         name: user.username,
//         info: "Confirm the booking",
//         table: {
//           data: [
//             {
//               RoomNumber: room.roomNumber + " - " + room.roomType.roomName,
//               CheckIn: checkIn.toLocaleDateString("vi-VN"),
//               CheckOut: checkOut.toLocaleDateString("vi-VN"),
//               Price: "$" + room.price,
//               TotalPrice: "$" + total,
//             },
//           ],
//           columns: {
//             customWidth: {
//               Price: "15%",
//             },
//           },
//         },
//         action: {
//           instructions: "Your booking has now been confirmed!",
//           button: {
//             color: "#22BC66", // Optional action button color
//             text: "View the booking",
//             link: "https://mailgen.js/confirm?s=d9729feb74992cc3482b350163a1a010",
//           },
//         },
//         outro:
//           "Need help, or have questions? Just reply to this email, we'd love to help.",
//       },
//     };
//     const mail = mailGenerator.generate(response);
//     const mailOptions = {
//       from: {
//         name: "Web TJ Hotel",
//         address: "<ha29042002@gmail.com>",
//       }, // sender address
//       to: user.email, // user's email
//       subject: "Confirm the booking", // Subject line
//       html: mail, // html body
//     };
//     await transporter.sendMail(mailOptions);

//     res.redirect("/reservation/history");
//   } catch (err) {
//     req.session.room = await roomModel.findById(roomId).populate("roomType"); // Refresh room data again
//     var room = req.session.room;
//     var roomType = req.session.roomType;
//     res.render("reservation/confirmation", {
//       room,
//       roomType,
//       error: err.message,
//     });
//   }
// });

router.post("/confirmation/:id", checkUser, async (req, res) => {
  try {
    var roomId = req.session.roomId;
    var checkIn = req.body.checkIn ? new Date(req.body.checkIn) : null;
    if (checkIn) {
      checkIn.setHours(0, 0, 0, 0);
    }
    var checkOut = req.body.checkOut ? new Date(req.body.checkOut) : null;
    if (checkOut) {
      checkOut.setHours(0, 0, 0, 0);
    }
    var date = new Date();
    date.setHours(0, 0, 0, 0);
    var user = req.user;
    var room = await roomModel.findById(roomId).populate("roomType");
    var userId = await userModel.findById(user);
    var total = totalPrice(room.price, checkIn, checkOut);
    req.session.total = total;
    if (room.status === "unavailable") {
      throw new Error("Room is in use");
    } else if (!checkIn || !checkOut) {
      throw new Error("Please select check-in and check-out dates");
    } else if (checkIn < date) {
      throw new Error("Check-in date must be in the future");
    } else if (checkIn.getTime() === checkOut.getTime()) {
      throw new Error("Same-day reservations are not possible");
    } else if (checkOut < checkIn) {
      throw new Error("Check-out date must be after check-in date");
    } else {
      var newReservation = {
        roomNumber: room.roomNumber,
        roomType: room.roomType.roomName,
        user: userId,
        checkIn: checkIn,
        checkOut: checkOut,
        status: "pending",
        totalPrice: total,
      };
    }
    req.session.reservation = newReservation;
    res.redirect("/reservation/payment");
  } catch (err) {
    req.session.room = await roomModel.findById(roomId).populate("roomType");
    var room = req.session.room;
    var roomType = req.session.roomType;
    res.render("reservation/confirmation", {
      room,
      roomType,
      error: err.message,
    });
  }
});

router.get("/payment", async (req, res) => {
  try {
    if (
      !req.session ||
      !req.session.total ||
      !req.session.roomId ||
      !req.session.reservation
    ) {
      res.render("reservation/payment", {
        total: null,
        room: null,
        checkIn: null,
        checkOut: null,
      });
      return;
    } else {
      var total = req.session.total;
      var roomId = req.session.roomId;
      req.session.room = await roomModel.findById(roomId).populate("roomType");
      var room = req.session.room;
      var checkIn = req.session.reservation.checkIn;
      var checkOut = req.session.reservation.checkOut;
      res.render("reservation/payment", { total, room, checkIn, checkOut });
    }
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});

//Đã thanh toán thành công
router.post("/payment", async (req, res) => {
  try {
    const roomType = String(req.body.roomType);
    const roomNumber = String(req.body.roomNumber);
    const checkIn = String(req.body.checkIn);
    const checkOut = String(req.body.checkOut);
    const total = String(req.body.total);
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:3000/reservation/history",
        cancel_url: "http://localhost:3000/room",
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: roomType + " - " + roomNumber,
                sku: checkIn + " - " + checkOut,
                price: total,
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: total,
          },
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.log(error.response.details);
        throw error;
      } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            res.redirect(payment.links[i].href);
          }
        }
      }
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/history", checkUser, async (req, res) => {
  try {
    const reservationDetails = req.session.reservation;
    const user = req.user;
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const roomId = req.session.roomId;
    const room = await roomModel.findById(roomId).populate("roomType");
    const roomNumber = roomId;

    if (!user) {
      res.redirect("/user/login");
      return;
    }

    if (reservationDetails) {
      var { checkIn, checkOut, totalPrice, status } = reservationDetails;
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const execute_payment_json = {
        payer_id: payerId,
        transactions: [
          {
            amount: {
              currency: "USD",
              total: totalPrice.toString(),
            },
          },
        ],
      };
      paypal.payment.execute(
        paymentId,
        execute_payment_json,
        async function (error, payment) {
          if (error) {
            console.log(error.response);
            throw error;
          } else {
            if (payment.state === "approved") {
              const newReservation = {
                roomNumber: roomNumber,
                user: user._id,
                checkIn: checkIn,
                checkOut: checkOut,
                status: status,
                totalPrice: totalPrice,
              };
              await reservationModel.create(newReservation);
              var response = {
                body: {
                  name: user.username,
                  info: "Confirm the booking",
                  table: {
                    data: [
                      {
                        RoomNumber:
                          room.roomNumber + " - " + room.roomType.roomName,
                        CheckIn: checkInDate.toLocaleDateString("vi-VN"),
                        CheckOut: checkOutDate.toLocaleDateString("vi-VN"),
                        Price: "$" + room.price,
                        TotalPrice: "$" + totalPrice,
                      },
                    ],
                    columns: {
                      customWidth: {
                        Price: "15%",
                      },
                    },
                  },
                  action: {
                    instructions: "Your booking has now been confirmed!",
                    button: {
                      color: "#22BC66", // Optional action button color
                      text: "View the booking",
                      link: "https://mailgen.js/confirm?s=d9729feb74992cc3482b350163a1a010",
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
                to: user.email, // user's email
                subject: "Confirm the booking", // Subject line
                html: mail, // html body
              };
              await transporter.sendMail(mailOptions);
            } else {
              res.redirect("/reservation/history");
            }
          }
        }
      );
    }
    //Biến từ session
    const reservation = await reservationModel
      .find({ user: user._id })
      .populate({
        path: "roomNumber",
        model: "room",
        populate: {
          path: "roomType",
          model: "roomType",
        },
      });
    res.render("reservation/history", { reservation });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;