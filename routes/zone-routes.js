const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const ZoneControllers = require("../controllers/zone-controllers");

const router = express.Router();

router.post("/add-zone", verifyTokenMiddleware, ZoneControllers.addZone);

router.patch("/update-zone", verifyTokenMiddleware, ZoneControllers.updateZone);

router.delete(
  "/delete-zone",
  verifyTokenMiddleware,
  ZoneControllers.deleteZoneById
);

router.get("/get-zone", ZoneControllers.getZone);

module.exports = router;
