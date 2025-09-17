const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const SeniorOfficerControllers = require("../controllers/medal-winner-controllers");

const router = express.Router();

router.post(
  "/add-medal-winner",
  verifyTokenMiddleware,
  SeniorOfficerControllers.addSeniorOfficer
);

router.patch(
  "/update-medal-winner",
  verifyTokenMiddleware,
  SeniorOfficerControllers.updateSeniorOfficer
);

router.delete(
  "/delete-medal-winner",
  verifyTokenMiddleware,
  SeniorOfficerControllers.deleteSeniorOfficer
);

router.get("/get-medal-winner", SeniorOfficerControllers.getSeniorOfficerData);

router.get(
  "/get-medal-by-sorted",
  SeniorOfficerControllers.getMedalWinnerSortedData
);

module.exports = router;
