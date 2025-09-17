const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const martyrsControllers = require("../controllers/martyrs-controllers");

const router = express.Router();

router.post(
  "/add-martyrs",
  verifyTokenMiddleware,
  martyrsControllers.addMartyrs
);

router.patch(
  "/update-martyrs",
  verifyTokenMiddleware,
  martyrsControllers.updateMartyrs
);

router.delete(
  "/delete-martyrs",
  verifyTokenMiddleware,
  martyrsControllers.deleteMartyrsData
);

router.get("/get-martyrs", martyrsControllers.getMartyrsData);

router.get("/martyrs-by-id", martyrsControllers.getMartyrsDatabyId);

module.exports = router;
