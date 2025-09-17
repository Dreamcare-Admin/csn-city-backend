const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const ACPControllers = require("../controllers/acp-controllers");

const router = express.Router();

router.post("/add-acp", verifyTokenMiddleware, ACPControllers.addACP);

router.patch("/update-acp", verifyTokenMiddleware, ACPControllers.updateACP);

router.delete("/delete-acp", verifyTokenMiddleware, ACPControllers.deleteACP);

router.get("/get-acp", ACPControllers.getACPData);

module.exports = router;
