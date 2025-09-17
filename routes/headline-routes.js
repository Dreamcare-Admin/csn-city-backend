const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const HeadlineControllers = require("../controllers/headline-controllers");

const router = express.Router();

router.get("/get-headline-all", HeadlineControllers.getRecordall);

router.get("/get-headline-latest-three", HeadlineControllers.getRecordThree);

router.post(
  "/add-headline-with-text",
  verifyTokenMiddleware,
  HeadlineControllers.addRecordWithText
);

router.post(
  "/add-headline-with-file",
  verifyTokenMiddleware,
  HeadlineControllers.addRecordWithFile
);

router.delete(
  "/delete-headline-record",
  verifyTokenMiddleware,
  HeadlineControllers.deleteRecordById
);

module.exports = router;
