const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");


// Signup + OTP login endpoints.
router.post("/signup", authController.signup);
router.post("/verify-signup", authController.verifySignup);
router.post("/send-otp", authController.sendLoginOTP);
router.post("/verify-otp", authController.verifyLoginOTP);

module.exports = router;
