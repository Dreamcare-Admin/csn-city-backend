const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const DivisionControllers = require("../controllers/division-controllers");

const router = express.Router();

router.post(
  "/add-division",
  verifyTokenMiddleware,
  DivisionControllers.addDivision
);

router.patch(
  "/update-division",
  verifyTokenMiddleware,
  DivisionControllers.updateDivision
);

router.delete(
  "/delete-division",
  verifyTokenMiddleware,
  DivisionControllers.deleteDivisionById
);

router.get("/get-division", DivisionControllers.getDivision);

module.exports = router;
