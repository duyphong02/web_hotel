var express = require("express");
var router = express.Router();
var userModel = require("../models/UserModel");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var validator = require("email-validator");
const { verifyToken, checkAdmin } = require("../middlewares/authMiddleware");
const e = require("express");

var salt = 10;
var timeOut = 1000 * 60 * 60 * 24;
const createToken = (id, username) => {
  return jwt.sign({ id, username }, "han_04");
};

router.get("/register", function (req, res) {
  res.render("user/register", { layout: "empty_layout" });
});

router.post("/register", async (req, res) => {
  try {
    var username = req.body.username;
    var email = req.body.email;
    var pass = req.body.password;
    var repass = req.body.repassword;
    var isValid = validator.validate(email);
    var hash = bcrypt.hashSync(pass, salt);
    if (!username) {
      throw new Error("Please enter username");
    } else if (!email) {
      throw new Error("Please enter email");
    } else if (!isValid) {
      throw new Error("Invalid email");
    } else if (!pass) {
      throw new Error("Please enter password");
    } else if (repass !== pass) {
      throw new Error("Password does not match");
    } else {
      var newUser = {
        username,
        email,
        password: hash,
        role: "user",
      };
      var user = await userModel.create(newUser);
      const token = createToken(user._id, user.username);
      //1. đặt tên cookie, 2. Giá trị lưu vào cookie
      res.cookie("access_token", token, {
        //Chỉ gắn cookie khi là http
        httpOnly: true,
        maxAge: timeOut,
      });
      res.redirect("/");
    }
  } catch (err) {
    return res.render("user/register", {
      error: err.message,
      layout: "empty_layout",
    });
  }
});

router.get("/login", async (req, res) => {
  res.render("user/login", { layout: "empty_layout" });
});

router.post("/login", async (req, res) => {
  try {
    var checkEmail = req.body.email;
    var checkPass = req.body.password;
    if (!checkEmail) {
      throw new Error("Please enter email");
    } else if (!checkPass) {
      throw new Error("Please enter password");
    }
    var user = await userModel.findOne({ email: checkEmail });
    if (!user) {
      throw new Error("User not found");
    }
    var hash = bcrypt.compareSync(checkPass, user.password);
    if (!hash) {
      throw new Error("Password is incorrect");
    } else {
      const token = createToken(user._id, user.username);
      res.cookie("access_token", token, {
        httpOnly: true,
        maxAge: timeOut,
      });
      if (user.role === "admin") {
        res.redirect("/manage");
      } else {
        res.redirect("/");
      }
    }
  } catch (err) {
    return res.render("user/login", {
      error: err.message,
      layout: "empty_layout",
    });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/");
});

module.exports = router;
