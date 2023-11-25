const express = require("express");
const {
  signUp,
  verifyAccount,
  resendOTP,
  login,
} = require("../controllers/authController");
const router = express.Router();

router.post("/signup", signUp);
router.post("/verify", verifyAccount);
router.post("/resendotp", resendOTP);
router.post("/login", login);

router.route("/");

router.route("/:id");

module.exports = router;
