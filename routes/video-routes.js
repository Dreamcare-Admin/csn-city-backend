const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const videoControllers = require("../controllers/video-controllers");

const router = express.Router();

router.post("/add-video", verifyTokenMiddleware, videoControllers.addVideo);

router.patch(
  "/update-video",
  verifyTokenMiddleware,
  videoControllers.updateVideo
);

router.delete(
  "/delete-video",
  verifyTokenMiddleware,
  videoControllers.deleteVideoById
);

router.get("/get-video", videoControllers.getVideos);

module.exports = router;
