const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");
const authControllers = require("../controllers/auth-controllers");

const router = express.Router();

router.post("/admin-login", authControllers.loginNew);

router.post("/verify-token", authControllers.verifyToken);

router.post("/admin-signup", verifyTokenMiddleware, authControllers.signup);
router.patch(
  "/update-user",
  verifyTokenMiddleware,
  authControllers.updatePassword
);

router.get("/get-admin-users", verifyTokenMiddleware, authControllers.getUsers);

router.get("/get-admin-users", verifyTokenMiddleware, authControllers.getUsers);

router.get("/get-admin-users", verifyTokenMiddleware, authControllers.getUsers);

router.delete(
  "/delete-user",
  verifyTokenMiddleware,
  authControllers.deleteUserById
);

router.get("/gen-code", authControllers.getSalt);

router.post("/forgot-password", authControllers.forgotpassword);

router.post("/update-password-with-otp", authControllers.updatePasswordWithOTP);

router.post("/update-logout", authControllers.logout);

router.post("/verify-otp", authControllers.verifyOtp);

module.exports = router;
