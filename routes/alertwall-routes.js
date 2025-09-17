const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const alertwallControllers = require("../controllers/alertwall-controllers");

const router = express.Router();

router.post(
  "/add-alertwall-data",
  verifyTokenMiddleware,
  alertwallControllers.addRecordWithFile
);

router.patch(
  "/update-alertwall-data",
  verifyTokenMiddleware,
  alertwallControllers.updateRecordById
);

router.delete(
  "/delete-alertwall-data",
  verifyTokenMiddleware,
  alertwallControllers.deleteRecordById
);

router.get("/get-alertwall-data", alertwallControllers.getRecordbyTag);

module.exports = router;
