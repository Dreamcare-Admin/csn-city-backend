const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const dcpvisitControllers = require("../controllers/dcp-visit-controllers");

const router = express.Router();

router.post("/add-entry", verifyTokenMiddleware, dcpvisitControllers.addentry);

router.get("/get-entry", dcpvisitControllers.getentries);

router.get("/get-all-entry", dcpvisitControllers.getentriesall);

router.delete(
  "/delete-entry",
  verifyTokenMiddleware,
  dcpvisitControllers.deleteEntryById
);

router.post(
  "/update-entry",
  verifyTokenMiddleware,
  dcpvisitControllers.updateEntry
);

module.exports = router;
