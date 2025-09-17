const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const sliderControllers = require("../controllers/homeslider-controllers");

const router = express.Router();

router.post(
  "/add-slider-image",
  verifyTokenMiddleware,
  sliderControllers.addSliderImage
);

router.get("/get-slider-image", sliderControllers.getSliderImages);

router.get("/get-slider-all", sliderControllers.getSliderImagespublic);

router.delete(
  "/delete-slider-image",
  verifyTokenMiddleware,
  sliderControllers.deleteSliderImageById
);

module.exports = router;
