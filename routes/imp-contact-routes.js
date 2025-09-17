const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const ImpContactControllers = require("../controllers/imp-contact-controllers");

const router = express.Router();

router.post(
  "/add-imp-contact",
  verifyTokenMiddleware,
  ImpContactControllers.addcontact
);

router.patch(
  "/update-imp-contact",
  verifyTokenMiddleware,
  ImpContactControllers.updateContact
);

router.delete(
  "/delete-imp-contact",
  verifyTokenMiddleware,
  ImpContactControllers.deleteContactById
);

router.get("/get-imp-contact", ImpContactControllers.getcontact);

module.exports = router;
