const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const spMessageControllers = require("../controllers/sp-message-controllers");

const router = express.Router();

router.post(
  "/add-sp-message",
  verifyTokenMiddleware,
  spMessageControllers.addMessageData
);

router.patch(
  "/update-sp-message",
  verifyTokenMiddleware,
  spMessageControllers.updateMessageData
);

router.get("/get-sp-message", spMessageControllers.getMessageData);

module.exports = router;
