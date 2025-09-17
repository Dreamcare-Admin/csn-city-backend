const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const wellfareControllers = require("../controllers/wellfare-controllers");

const router = express.Router();

router.post(
  "/add-wellfare-data",
  verifyTokenMiddleware,
  wellfareControllers.addWellfare
);

router.patch(
  "/update-wellfare-data",
  verifyTokenMiddleware,
  wellfareControllers.updateWellfare
);

router.delete(
  "/delete-wellfare-data",
  verifyTokenMiddleware,
  wellfareControllers.deleteWellfareData
);

router.get("/get-all-wellfare", wellfareControllers.getWellfareDataAll);

router.get("/get-wellfare-by-id", wellfareControllers.getWellfareDatabyId);

router.get("/get-initiative-home", wellfareControllers.getInitiativeDataHome);

module.exports = router;
