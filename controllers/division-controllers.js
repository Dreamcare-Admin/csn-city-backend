const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const Division = require("../models/division");

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

require("dotenv").config();

const addDivision = async (req, res, next) => {
  const { name, name_in_marathi, acp_name, acp_name_in_marathi, acp_contact } =
    req.body;

  const sanitizedName = DOMPurify.sanitize(name);
  const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
  const sanitizedAcpName = DOMPurify.sanitize(acp_name);
  const sanitizedAcpNameInMarathi = DOMPurify.sanitize(acp_name_in_marathi);
  const sanitizedAcpContact = DOMPurify.sanitize(acp_contact);

  if (
    (!sanitizedName && name) ||
    (!sanitizedNameInMarathi && name_in_marathi) ||
    (!sanitizedAcpName && acp_name) ||
    (!sanitizedAcpNameInMarathi && acp_name_in_marathi) ||
    (!sanitizedAcpContact && acp_contact)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  const createdDivision = new Division({
    name,
    name_in_marathi,
    acp_name,
    acp_name_in_marathi,
    acp_contact,
  });

  try {
    await createdDivision.save();
    res
      .status(201)
      .json({ success: true, message: "new division added successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getDivision = async (req, res, next) => {
  let divisions;

  try {
    divisions = await Division.find({}).sort({ createdAt: -1 });

    res.status(200).json({ divisions });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const updateDivision = async (req, res, next) => {
  const { Id } = req.query;

  const {
    name,
    name_in_marathi,
    sr_no,
    acp_name,
    acp_name_in_marathi,
    acp_contact,
  } = req.body;

  const sanitizedName = DOMPurify.sanitize(name);
  const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
  const sanitizedAcpName = DOMPurify.sanitize(acp_name);
  const sanitizedAcpNameInMarathi = DOMPurify.sanitize(acp_name_in_marathi);
  const sanitizedAcpContact = DOMPurify.sanitize(acp_contact);

  if (
    (!sanitizedName && name) ||
    (!sanitizedNameInMarathi && name_in_marathi) ||
    (!sanitizedAcpName && acp_name) ||
    (!sanitizedAcpNameInMarathi && acp_name_in_marathi) ||
    (!sanitizedAcpContact && acp_contact)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  try {
    const divisiondata = await Division.findById(Id);

    if (!divisiondata) {
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    divisiondata.name = name;
    divisiondata.name_in_marathi = name_in_marathi;
    divisiondata.sr_no = sr_no;
    divisiondata.acp_name = acp_name;
    divisiondata.acp_name_in_marathi = acp_name_in_marathi;
    divisiondata.acp_contact = acp_contact;

    await divisiondata.save();

    res
      .status(200)
      .json({ success: true, message: "data updated successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteDivisionById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    await Division.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.addDivision = addDivision;

exports.getDivision = getDivision;

exports.updateDivision = updateDivision;

exports.deleteDivisionById = deleteDivisionById;
