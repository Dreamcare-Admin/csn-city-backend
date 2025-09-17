const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const formerADGControllers = require("../controllers/formercp-controllers");

const router = express.Router();

router.post(
  "/add-adg",
  //   verifyTokenMiddleware,
  formerADGControllers.addformerADG
);

router.patch(
  "/update-adg",
  verifyTokenMiddleware,
  formerADGControllers.updateADGdata
);

router.delete(
  "/delete-adg",
  verifyTokenMiddleware,
  formerADGControllers.deleteADGData
);

router.get("/get-adg", formerADGControllers.getformderADGData);

module.exports = router;
