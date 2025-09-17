const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const AccidentCompensationControllers = require("../controllers/accident-compensation-controllers");

const router = express.Router();

router.post(
  "/add-accident-compensation",
    verifyTokenMiddleware,
  AccidentCompensationControllers.createAccidentCompensation
);

router.patch(
  "/update-accident-compensation",
  verifyTokenMiddleware,
  AccidentCompensationControllers.updateAccidentCompensation
);

router.delete(
  "/delete-accident-compensation",
  verifyTokenMiddleware,
  AccidentCompensationControllers.deleteAccidentCompensationById
);

router.get(
  "/get-accident-compensation",
  AccidentCompensationControllers.geAccidentCompensation
);

router.get("/get-ac-by-user", AccidentCompensationControllers.geACbyUser);

router.get("/get-ac-by-filter", AccidentCompensationControllers.getACbyFilter);

module.exports = router;
