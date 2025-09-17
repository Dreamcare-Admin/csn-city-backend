const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const UnitOfficerControllers = require("../controllers/unit-officer-controllers");

const router = express.Router();

router.post(
  "/add-unit-officer",
  verifyTokenMiddleware,
  UnitOfficerControllers.createOfficer
);

router.patch(
  "/update-unit-officer",
  verifyTokenMiddleware,
  UnitOfficerControllers.updateOfficer
);

router.delete(
  "/delete-unit-officer",
  verifyTokenMiddleware,
  UnitOfficerControllers.deleteOfficerById
);

router.get("/unit-officers-admin", UnitOfficerControllers.getOfficersAdmin);

router.get("/officer-by-unit", UnitOfficerControllers.getUnitOfficersbyUnit);

module.exports = router;
