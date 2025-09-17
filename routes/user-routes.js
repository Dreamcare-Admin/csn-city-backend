const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const UserControllers = require("../controllers/user-controllers");

const router = express.Router();

router.post("/signup-user", UserControllers.signup);

router.post("/login-user", UserControllers.login);

router.get("/get-users", verifyTokenMiddleware, UserControllers.getUsers);

router.delete(
  "/delete-user",
  verifyTokenMiddleware,
  UserControllers.deleteUserById
);

router.patch(
  "/update-user",
  verifyTokenMiddleware,
  UserControllers.updatePassword
);

module.exports = router;
