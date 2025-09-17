const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");
// const Group = require("../models/Group");

const signup = async (req, res, next) => {
  const { email, password, psId } = req.body;

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

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "somthing went wrong" });
  }

  const tempdata = { email, password: hashedPassword };
  if (psId) {
    tempdata.psId = psId;
  }

  const createdUser = new User(tempdata);

  try {
    await createdUser.save();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "somthing went wrong" });
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      "dreamcare",
      { expiresIn: "30d" }
    );
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "somthing went wrong" });
  }

  res.status(201).json({
    success: true,
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "somthing went wrong" });
  }

  if (!existingUser) {
    return res
      .status(401)
      .json({ success: false, message: "somthing went wrong" });
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "somthing went wrong" });
  }

  if (!isValidPassword) {
    return res
      .status(401)
      .json({ success: false, message: "invalid password" });
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      },
      "dreamcare",
      { expiresIn: "30d" }
    );
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "somthing went wrong" });
  }

  let psidtemp = null;

  if (existingUser.psId) {
    psidtemp = existingUser.psId;
  }

  res.json({
    success: true,
    role: existingUser.role,
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
    psId: psidtemp,
  });
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
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
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

const updatePassword = async (req, res, next) => {
  const { Id } = req.query;
  //   console.log(Id);

  const { email, password, psId } = req.body;

  try {
    const usertemp = await User.findById(Id);

    if (!usertemp) {
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    if (email) {
      usertemp.email = email;
    }

    if (psId) {
      usertemp.psId = psId;
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
      //   console.log(err);
      return res
        .status(401)
        .json({ success: false, message: "somthing went wrong" });
    }

    usertemp.password = hashedPassword;

    await usertemp.save();

    res
      .status(200)
      .json({ success: true, message: "data updated successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.signup = signup;
exports.login = login;
exports.getUsers = getUsers;
exports.deleteUserById = deleteUserById;
exports.updatePassword = updatePassword;
