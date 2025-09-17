const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const OfficerControllers = require("../controllers/ps-officer-controllers");

const router = express.Router();

router.post(
  "/add-officer",
  verifyTokenMiddleware,
  OfficerControllers.createOfficer
);

router.patch(
  "/update-officer",
  verifyTokenMiddleware,
  OfficerControllers.updateOfficer
);

router.delete(
  "/delete-officer",
  verifyTokenMiddleware,
  OfficerControllers.deleteOfficerById
);

router.get("/officers-admin", OfficerControllers.getOfficersAdmin);

router.get("/get-officer-by-user", OfficerControllers.getOfficersByUser);

router.get("/officers-by-zone", OfficerControllers.getOfficerByZone);

router.get("/officers-by-division", OfficerControllers.getOfficerByDivision);

module.exports = router;
