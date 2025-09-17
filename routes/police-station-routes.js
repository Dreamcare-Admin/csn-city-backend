const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const PoliceStationControllers = require("../controllers/police-station-controllers");

const router = express.Router();

router.post(
  "/add-station",
  verifyTokenMiddleware,
  PoliceStationControllers.createStation
);

router.patch(
  "/update-station",
  verifyTokenMiddleware,
  PoliceStationControllers.updateStation
);

router.delete(
  "/delete-station",
  verifyTokenMiddleware,
  PoliceStationControllers.deleteStationById
);

router.get("/get-stations", PoliceStationControllers.getStations);

router.get("/get-user-station", PoliceStationControllers.getStationforUser);

router.get("/stations-admin", PoliceStationControllers.getStationsAdmin);

router.get(
  "/stations-by-id-admin",
  PoliceStationControllers.getStationsAdminbyId
);

router.get("/station-detail", PoliceStationControllers.getStationbyId);

module.exports = router;
