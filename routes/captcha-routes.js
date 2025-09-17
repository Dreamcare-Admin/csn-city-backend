const express = require("express");
const { verifyCaptcha } = require("../controllers/captcha-controllers");

const router = express.Router();

router.post("/verify-captcha", verifyCaptcha);

module.exports = router;
