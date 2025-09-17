const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const RegionControllers = require("../controllers/region-controllers");

const router = express.Router();

router.post("/add-region", verifyTokenMiddleware, RegionControllers.addRegion);

router.patch(
  "/update-region",
  verifyTokenMiddleware,
  RegionControllers.updateRegion
);

router.delete(
  "/delete-region",
  verifyTokenMiddleware,
  RegionControllers.deleteRegionById
);

router.get("/get-region", RegionControllers.getRegion);

module.exports = router;
