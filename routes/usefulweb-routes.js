const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const usefulwebControllers = require("../controllers/useful-web-controllers");

const router = express.Router();

router.post(
  "/add-website",
  verifyTokenMiddleware,
  usefulwebControllers.addwebsite
);

router.patch(
  "/update-website",
  verifyTokenMiddleware,
  usefulwebControllers.updatelink
);

router.delete(
  "/delete-website",
  verifyTokenMiddleware,
  usefulwebControllers.deletelinkById
);

router.get("/get-website", usefulwebControllers.getusefulsite);

module.exports = router;
