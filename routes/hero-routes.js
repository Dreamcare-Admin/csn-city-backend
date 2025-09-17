const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const heroControllers = require("../controllers/hero-controllers");

const router = express.Router();

router.post("/add-hero-data", verifyTokenMiddleware, heroControllers.addHero);

router.patch(
  "/update-hero-data",
  verifyTokenMiddleware,
  heroControllers.updateHero
);

router.delete(
  "/delete-hero-data",
  verifyTokenMiddleware,
  heroControllers.deleteHeroData
);

router.get("/get-hero-data", heroControllers.getHeroData);

module.exports = router;
