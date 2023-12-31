const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const sendEmail = require("./../utils/email");
const AppError = require("../utils/appError");
const { promisify } = require("util");
const crypto = require("crypto");

const signToken = (email) => {
  return jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user.email);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("token", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    message,
    token,
    data: {
      user,
    },
  });
};

// SignUp function
exports.signUp = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError("Email already registered", 400));
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    photo: req.body.photo,
    passwordChangedAt: req.body.passwordChangedAt,
    otp,
  });

  try {
    await sendEmail({
      email: email,
      subject: "Your OTP for Email Verification",
      html: `<h3>Your OTP is  : ${otp}</h3>`,
    });

    createSendToken(
      newUser,
      200,
      res,
      "Registration Successful. Check your email for OTP verification."
    );
  } catch (err) {
    await User.findByIdAndDelete(newUser.id);
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

// email verification
exports.verifyAccount = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(
      new AppError("Email and OTP are required for verification", 400)
    );
  }

  const user = await User.findOne({ email, otp });

  if (!user) {
    return next(new AppError("Invalid OTP", 400));
  }

  // Mark the user as verified and clear the OTP
  user.isVerified = true;
  user.otp = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Email has been verified. You can now log in.",
  });
});

// resend OTP
exports.resendOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Find the user by their email
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Generate a new OTP
  const newOTP = Math.floor(100000 + Math.random() * 900000).toString();

  // Update the user's OTP in the database
  user.otp = newOTP;
  await user.save();

  // Send the new OTP to the user's email
  try {
    await sendEmail({
      email: user.email,
      subject: "Your New OTP for Email Verification",
      text: `Your new OTP for email verification: ${newOTP}`,
    });

    res.status(200).json({
      status: "success",
      message: "New OTP has been sent to your email. Check your inbox.",
    });
  } catch (err) {
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

// Login

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please Provide your email and password", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  console.log(user);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  createSendToken(user, 200, res, "Login Successful");
});
