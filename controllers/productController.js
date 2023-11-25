const catchAsync = require("../utils/catchAsync");

exports.getAllProduct = catchAsync(async (req, res, next) => {
  res.status(200).json({
    message: "Success (ALL PRODUCT)",
  });
});
exports.getSingleProduct = catchAsync(async (req, res, next) => {
  res.status(200).json({
    message: "Success (SINGLE PRODUCT)",
  });
});
exports.createProduct = catchAsync(async (req, res, next) => {
  res.status(201).json({
    message: "Success (CREATE PRODUCT)",
  });
});
exports.updateProduct = catchAsync(async (req, res, next) => {
  res.status(200).json({
    message: "Success (UPDATE PRODUCT)",
  });
});
exports.deleteProduct = catchAsync(async (req, res, next) => {
  res.status(204).json({
    message: "Success (DELETE PRODUCT)",
  });
});
