const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Contact = require("../models/contact");

require("dotenv").config();

const addcontact = async (req, res, next) => {
  const { name, email, mobile, message, groupId } = req.body;

  const createdContact = new Contact({
    name,
    email,
    mobile,
    message,
    groupId,
  });

  try {
    await createdContact.save();

    res
      .status(201)
      .json({ success: true, message: "new contact created successfully!" });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const getContact = async (req, res, next) => {
  let contacts;

  const { Id } = req.query;

  try {
    contacts = await Contact.find({ groupId: Id }).sort({ createdAt: -1 });

    res.status(200).json({ contacts });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const deleteContactById = async (req, res, next) => {
  try {
    const { id } = req.query;
    // console.log(id);

    // Delete the record from MongoDB
    await Contact.findByIdAndDelete(id);

    res.json({ success: true, message: "Contact deleted successfully" });
  } catch (err) {
    console.error(err);
    const error = new HttpError(
      "Something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "Something went wrong" });
    return next(error);
  }
};

exports.addcontact = addcontact;

exports.getContact = getContact;

exports.deleteContactById = deleteContactById;
