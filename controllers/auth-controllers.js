const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Contact = require("../models/contact");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const axios = require("axios");
const nodemailer = require("nodemailer");

require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOtp = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Login OTP',
    text: `Your OTP for login is: ${otp}`,
  };

  await transporter.sendMail(mailOptions);
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const verifyOtp = async (req, res) => {
  const { email, otp, deviceInfo } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // if (user.otp !== otp) {
    //   return res.status(401).json({ success: false, message: "Invalid OTP" });
    // }

    // Clear the OTP after successful verification
    user.otp = null;

    // Generate token
    const token = jwt.sign(
      {
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        passwordChangedAt: user.passwordChangedAt
          ? Math.floor(user.passwordChangedAt.getTime() / 1000)
          : 0,
      },
      "dreamcare",
      { expiresIn: "1d" }
    );

    // Add the new token to active tokens (allow multiple sessions)
    const newSession = {
      token: token,
      deviceInfo: deviceInfo || {},
      createdAt: new Date()
    };

    // Initialize activeTokens array if it doesn't exist
    if (!user.activeTokens) {
      user.activeTokens = [];
    }

    // Add the new session
    user.activeTokens.push(newSession);

    // Optional: Limit the number of concurrent sessions (e.g., max 5 sessions)
    const maxSessions = 5;
    if (user.activeTokens.length > maxSessions) {
      // Remove the oldest session
      user.activeTokens = user.activeTokens.slice(-maxSessions);
    }

    await user.save();

    res.json({
      success: true,
      token: token,
      role: user.role,
      psId: user.psId,
      sessionExpired: false // No session expiration for multiple logins
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

const secretKey = "dreamcare";

const adminUser = {
  email: "admin@msscweb.com",
  password: "Securedcd@2024",
};

const passwordHistoryLimit = 5;

const verifyToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(401)
      .json({ 
        verified: false, 
        message: "Token not provided",
        shouldLogout: true 
      });
  }

  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ 
          verified: false, 
          message: "Invalid token",
          shouldLogout: true 
        });
    }

    try {
      const currentUser = await User.findOne({ email: decoded.email });
      if (!currentUser) {
        return res.status(401).json({
          verified: false,
          message: "The user belonging to this token does no longer exist.",
          shouldLogout: true
        });
      }

      // Check if this token is in the active tokens array (support multiple sessions)
      const activeSession = currentUser.activeTokens?.find(session => session.token === token);
      if (!activeSession) {
        return res.status(401).json({
          verified: false,
          message: "Session not found or expired.",
          shouldLogout: true,
          reason: "session_not_found"
        });
      }

      // Check if the token is blacklisted
      if (currentUser.blacklistedTokens.includes(token)) {
        return res.status(401).json({
          verified: false,
          message: "Token has been invalidated. Please log in again.",
          shouldLogout: true
        });
      }

      // Check if the password has changed after the token was issued
      if (currentUser.passwordChangedAt) {
        const changedTimestamp = parseInt(
          currentUser.passwordChangedAt.getTime() / 1000,
          10
        );
        if (decoded.iat < changedTimestamp) {
          return res.status(401).json({
            verified: false,
            message: "Password recently changed. Please log in again.",
            shouldLogout: true
          });
        }
      }

      res.json({ 
        verified: true,
        role: currentUser.role,
        shouldLogout: false
      });
    } catch (error) {
      return res
        .status(500)
        .json({ 
          verified: false, 
          message: "Internal server error",
          shouldLogout: true 
        });
    }
  });
};

const signup = async (req, res, next) => {
  const { email, password, mobile_no, psId,role } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "somthing went wrong" });
  }

  if (existingUser) {
    return res
      .status(401)
      .json({ success: false, message: "User already Exists" });
  }

  const createdUser = new User({
    email,
    password: password,
    mobile_no,
    psId: psId,
    role: role,
  });

  try {
    await createdUser.save();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "somthing went wrong" });
  }

  let token;
  try {
    token = jwt.sign({ email: createdUser.email }, "dreamcare", {
      expiresIn: "30d",
    });
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "somthing went wrong" });
  }

  res.status(201).json({
    success: true,
    token: token,
  });
};

const loginNew = async (req, res, next) => {
  const { email, password } = req.body;
  const salt = req.headers["x-salt-value"];

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }

  console.log("user", existingUser);

  if (!existingUser) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }

  // Check if the account is locked
  if (existingUser.lockUntil && existingUser.lockUntil > Date.now()) {
    return res.status(403).json({
      success: false,
      message: "Account is locked for 30 minutes. Try again later.",
    });
  }

  let isValidPassword = false;
  const passtemp = existingUser.password;
  const saltedPassword = passtemp + salt;
  const hashedPassword = CryptoJS.SHA256(saltedPassword).toString(
    CryptoJS.enc.Hex
  );

  if (hashedPassword === password) {
    isValidPassword = true;
  }

  console.log("isValidPassword", isValidPassword);

  if (!isValidPassword) {
    // Increment failed login attempts
    existingUser.failedLoginAttempts += 1;

    if (existingUser.failedLoginAttempts >= 10) {
      // Lock the account for 30 minutes
      existingUser.lockUntil = Date.now() + 30 * 60 * 1000;
      existingUser.failedLoginAttempts = 0; // reset failed attempts
    }

    await existingUser.save();

    return res
      .status(401)
      .json({ success: false, message: "Invalid Email or password" });
  }

  // Reset failed login attempts on successful login
  existingUser.failedLoginAttempts = 0;
  existingUser.lockUntil = null;

  // Generate and save OTP
  const otp = generateOTP();
  existingUser.otp = otp;
  await existingUser.save();

  // Send OTP via email
  // try {
  //   await sendOtp(existingUser.email, otp);
  // } catch (error) {
  //   return res.status(500).json({ success: false, message: "Failed to send OTP" });
  // }

  res.json({
    success: true,
    message: "OTP sent to your email",
  });
};

const updatePassword = async (req, res, next) => {
  const { Id } = req.query;

  const { oldPassword, newPassword } = req.body;

  try {
    const usertemp = await User.findById(Id);

    if (!usertemp) {
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    if (oldPassword === usertemp.password) {
      if (usertemp.passwordHistory.includes(newPassword)) {
        return res.status(400).json({
          success: false,
          message:
            "This Password was already used. Please use a new password !",
        });
      }

      usertemp.passwordHistory.push(usertemp.password);

      if (usertemp.passwordHistory.length > passwordHistoryLimit) {
        usertemp.passwordHistory.shift(); // Remove the oldest password hash
      }

      usertemp.password = newPassword;
      usertemp.passwordChangedAt = Date.now() - 1000;
      await usertemp.save();
      return res
        .status(200)
        .json({ success: true, message: "data updated successfully!" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Oops Old password is wrong!" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const updatePasswordWithOTP = async (req, res, next) => {
  const { newPassword, otp, mobile_no } = req.body;

  try {
    const usertemp = await User.findOne({ mobile_no: mobile_no });

    // console.log(usertemp);

    if (!usertemp) {
      return res
        .status(500)
        .json({ success: false, message: "User does not exists" });
    }

    if (usertemp.passwordHistory.includes(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "This Password was already used. Please use a new password !",
      });
    }

    usertemp.passwordHistory.push(usertemp.password);

    if (usertemp.passwordHistory.length > passwordHistoryLimit) {
      usertemp.passwordHistory.shift(); // Remove the oldest password hash
    }

    usertemp.password = newPassword;
    usertemp.passwordChangedAt = Date.now() - 1000;
    await usertemp.save();
    return res
      .status(200)
      .json({ success: true, message: "data updated successfully!" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}).sort({ createdAt: -1 }).populate({
      path: "psId",
      select: "name name_in_marathi",
    });

    res.status(200).json({ Users: users });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const deleteUserById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    await User.findByIdAndDelete(Id);

    res.json({ success: true, message: "user deleted successfully" });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "Something went wrong" });
    return next(error);
  }
};

const getSalt = async (req, res, next) => {
  try {
    const salt = crypto.randomBytes(16).toString("hex");

    res.json({ success: true, salt: salt });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const forgotpassword = async (req, res, next) => {
  let existingUser;

  const { mobile_no } = req.body;

  try {
    existingUser = await User.findOne({ mobile_no: mobile_no });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }

  if (!existingUser) {
    return res.status(401).json({
      success: false,
      message: "User Does not Exists with associated mobile No!",
    });
  }

  const otp = generateOTP();

  const hashedData = crypto.createHash("sha256").update(otp).digest("hex");

  try {
    const response = await axios.get(
      `http://web.smsgw.in/smsapi/httpapi.jsp?username=mbvvpc&password=123123&from=MAHPOL&to=${mobile_no}&text=OTP is ${otp} Police Website MAHPOL&pe_id=1601100000000004090&template_id=1607100000000054716&coding=0`
    );

    existingUser.otp = otp;

    await existingUser.save();

    return res.status(200).json({ success: true, otp: hashedData });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const logout = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token not provided" });
  }

  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    try {
      const currentUser = await User.findOne({ email: decoded.email });
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: "The user belonging to this token does no longer exist.",
        });
      }

      // Add token to blacklistedTokens array if it matches the active token
      if (currentUser.activeToken === token) {
        currentUser.blacklistedTokens.push(token);
        // Keep only the last 10 blacklisted tokens
        if (currentUser.blacklistedTokens.length > 10) {
          currentUser.blacklistedTokens = currentUser.blacklistedTokens.slice(-10);
        }
        // Clear the active token
        currentUser.activeToken = null;
        await currentUser.save();
      }

      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });
};

// exports.login = login;
exports.verifyToken = verifyToken;
exports.signup = signup;
exports.loginNew = loginNew;
exports.updatePassword = updatePassword;
exports.updatePasswordWithOTP = updatePasswordWithOTP;
exports.getUsers = getUsers;
exports.deleteUserById = deleteUserById;
exports.getSalt = getSalt;
exports.forgotpassword = forgotpassword;
exports.logout = logout;
exports.verifyOtp = verifyOtp;