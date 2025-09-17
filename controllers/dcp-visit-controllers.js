const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Dcpvisit = require("../models/dcpvisit");

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

require("dotenv").config();

const addentry = async (req, res, next) => {
  const { psId, first_date, second_date } = req.body;

  const sanitizedPsId = DOMPurify.sanitize(psId);
  const sanitizedFirstDate = DOMPurify.sanitize(first_date);
  const sanitizedSecondDate = DOMPurify.sanitize(second_date);

  if (
    (!sanitizedPsId && psId) ||
    (!sanitizedFirstDate && first_date) ||
    (!sanitizedSecondDate && second_date)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  const createdentry = new Dcpvisit({
    psId,
    first_date,
    second_date,
  });

  try {
    await createdentry.save();

    res.status(201).json({
      success: true,
      message: "new record added successfully!",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getentries = async (req, res, next) => {
  const { psId, page = 1, limit = 30 } = req.query;

  try {
    const entries = await Dcpvisit.find({ psId: psId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate([
        {
          path: "psId",
          select: "name name_in_marathi",
          populate: {
            path: "zone",
            select: "name name_in_marathi", // Assuming 'zoneName' is a field in the Zone schema
          },
        },
      ]);

    const totalEntries = await Dcpvisit.countDocuments({ psId: psId });

    res.status(200).json({
      entries,
      totalEntries,
      totalPages: Math.ceil(totalEntries / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getentriesall = async (req, res, next) => {
  const { page = 1, limit = 30 } = req.query; // Default to page 1, limit 10 if not provided

  try {
    const entries = await Dcpvisit.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate([
        {
          path: "psId",
          select: "name name_in_marathi",
          populate: {
            path: "zone",
            select: "name name_in_marathi",
          },
        },
      ]);

    const totalEntries = await Dcpvisit.countDocuments();

    res.status(200).json({
      entries,
      totalEntries,
      totalPages: Math.ceil(totalEntries / limit),
      currentPage: page,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const deleteEntryById = async (req, res, next) => {
  try {
    const { id } = req.query;
    // console.log(id);

    // Delete the record from MongoDB
    await Dcpvisit.findByIdAndDelete(id);

    res.json({ success: true, message: "record deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const updateEntry = async (req, res, next) => {
  const { id } = req.query; // Assuming the teacher's ID is passed as a parameter

  const { psId, first_date, second_date } = req.body;

  const sanitizedPsId = DOMPurify.sanitize(psId);
  const sanitizedFirstDate = DOMPurify.sanitize(first_date);
  const sanitizedSecondDate = DOMPurify.sanitize(second_date);

  if (
    (!sanitizedPsId && psId) ||
    (!sanitizedFirstDate && first_date) ||
    (!sanitizedSecondDate && second_date)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  try {
    const entry = await Dcpvisit.findById(id);

    if (!entry) {
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    entry.psId = psId;
    entry.first_date = first_date;
    entry.second_date = second_date;

    await entry.save();

    res
      .status(200)
      .json({ success: true, message: "data updated successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.addentry = addentry;

exports.getentries = getentries;

exports.getentriesall = getentriesall;

exports.deleteEntryById = deleteEntryById;

exports.updateEntry = updateEntry;
