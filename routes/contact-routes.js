const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const contactControllers = require("../controllers/contact-controllers");

const router = express.Router();

router.post("/add-contact", contactControllers.addcontact);

router.get(
  "/get-contact",
  verifyTokenMiddleware,
  contactControllers.getContact
);

router.delete(
  "/delete-contact",
  verifyTokenMiddleware,
  contactControllers.deleteContactById
);

module.exports = router;
