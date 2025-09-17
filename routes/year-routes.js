const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const YearControllers = require("../controllers/year-controllers");

const router = express.Router();

router.post("/add-year", YearControllers.addYear);

router.patch("/update-year", verifyTokenMiddleware, YearControllers.updateYear);

router.delete(
  "/delete-year",
  verifyTokenMiddleware,
  YearControllers.deleteYearById
);

router.get("/get-year", YearControllers.getYear);

module.exports = router;
