const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const SpecialUnitControllers = require("../controllers/special-unit-controllers");

const router = express.Router();

router.post(
  "/add-unit",
  verifyTokenMiddleware,
  SpecialUnitControllers.createUnit
);

router.patch(
  "/update-unit",
  verifyTokenMiddleware,
  SpecialUnitControllers.updateUnit
);

router.delete(
  "/delete-unit",
  verifyTokenMiddleware,
  SpecialUnitControllers.deleteUnitById
);

router.get("/get-units", SpecialUnitControllers.getUnits);

router.get("/unit-detail", SpecialUnitControllers.getUnitbyId);

module.exports = router;
