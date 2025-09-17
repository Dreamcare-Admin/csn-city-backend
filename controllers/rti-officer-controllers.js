const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const RTIofficer = require("../models/rti-officer");

require("dotenv").config();

const addRTIOfficer = async (req, res, next) => {
  const { groupId, sr_no, title, title_in_marathi, contact_no, email } =
    req.body;

  const datatemp = {
    title,
    groupId,
  };

  if (sr_no) {
    datatemp.sr_no = sr_no;
  }
  if (title_in_marathi) {
    datatemp.title_in_marathi = title_in_marathi;
  }

  if (contact_no) {
    datatemp.contact_no = contact_no;
  }

  if (email) {
    datatemp.email = email;
  }

  const createdcontact = new RTIofficer(datatemp);

  try {
    await createdcontact.save();

    res.status(201).json({ success: true, message: "rti added successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getRTIOfficer = async (req, res, next) => {
  let datarti;
  const { groupId } = req.query;

  try {
    datarti = await RTIofficer.find({ groupId: groupId }).sort({ sr_no: 1 });

    res.status(200).json({ success: true, datarti: datarti });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const updateRTIOfficer = async (req, res, next) => {
  const { Id } = req.query;

  const { sr_no, title, title_in_marathi, contact_no, email } = req.body;

  try {
    const rti = await RTIofficer.findById(Id);

    if (!rti) {
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    rti.sr_no = sr_no;
    rti.title = title;
    rti.title_in_marathi = title_in_marathi;
    rti.contact_no = contact_no;
    rti.email = email;

    await rti.save();

    res.status(200).json({
      success: true,
      message: "data updated successfully!",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteRTIOfficerById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    await RTIofficer.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.addRTIOfficer = addRTIOfficer;

exports.getRTIOfficer = getRTIOfficer;

exports.updateRTIOfficer = updateRTIOfficer;

exports.deleteRTIOfficerById = deleteRTIOfficerById;
