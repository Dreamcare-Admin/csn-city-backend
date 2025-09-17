const express = require("express");
const { check } = require("express-validator");

const mainControllers = require("../controllers/main-controllers");

const verifyTokenMiddleware = require("../middleware/verifyToken");

const router = express.Router();

router.post("/add-record", verifyTokenMiddleware, mainControllers.addRecord);

router.delete(
  "/delete-record",
  verifyTokenMiddleware,
  mainControllers.deleteRecordById
);

router.get("/records-by-tag", mainControllers.getRecordbyTag);

router.get("/get-latest-three", mainControllers.getLatestThreeRecords);

router.post(
  "/update-record",
  verifyTokenMiddleware,
  mainControllers.updateRecord
);

module.exports = router;
