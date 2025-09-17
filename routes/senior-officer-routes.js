const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const SeniorOfficerControllers = require("../controllers/senior-officer-controllers");

const router = express.Router();

router.post(
  "/add-senior-officer",
  verifyTokenMiddleware,
  SeniorOfficerControllers.addSeniorOfficer
);

router.patch(
  "/update-senior-officer",
  verifyTokenMiddleware,
  SeniorOfficerControllers.updateSeniorOfficer
);

router.delete(
  "/delete-senior-officer",
  verifyTokenMiddleware,
  SeniorOfficerControllers.deleteSeniorOfficer
);

router.get(
  "/get-senior-officer",
  SeniorOfficerControllers.getSeniorOfficerData
);

router.get(
  "/stations-with-officers",
  SeniorOfficerControllers.getStationsWithOfficers
);

module.exports = router;
