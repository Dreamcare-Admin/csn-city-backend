const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const Zone = require("../models/zone");
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

require("dotenv").config();

const addZone = async (req, res, next) => {
  const { name, name_in_marathi, dcp_name, dcp_name_in_marathi, dcp_contact } =
    req.body;

  const sanitizedName = DOMPurify.sanitize(name);
  const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
  const sanitizedDcpName = DOMPurify.sanitize(dcp_name);
  const sanitizedDcpNameInMarathi = DOMPurify.sanitize(dcp_name_in_marathi);
  const sanitizedDcpContact = DOMPurify.sanitize(dcp_contact);

  if (
    (!sanitizedName && name) ||
    (!sanitizedNameInMarathi && name_in_marathi) ||
    (!sanitizedDcpName && dcp_name) ||
    (!sanitizedDcpNameInMarathi && dcp_name_in_marathi) ||
    (!sanitizedDcpContact && dcp_contact)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  const createdDivision = new Zone({
    name,
    name_in_marathi,
    dcp_name,
    dcp_name_in_marathi,
    dcp_contact,
  });

  try {
    await createdDivision.save();
    res
      .status(201)
      .json({ success: true, message: "new Zone added successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getZone = async (req, res, next) => {
  let zones;

  try {
    zones = await Zone.find({}).sort({ createdAt: -1 });

    res.status(200).json({ zones });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const updateZone = async (req, res, next) => {
  const { Id } = req.query;

  const { name, name_in_marathi, dcp_name, dcp_name_in_marathi, dcp_contact } =
    req.body;

  const sanitizedName = DOMPurify.sanitize(name);
  const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
  const sanitizedDcpName = DOMPurify.sanitize(dcp_name);
  const sanitizedDcpNameInMarathi = DOMPurify.sanitize(dcp_name_in_marathi);
  const sanitizedDcpContact = DOMPurify.sanitize(dcp_contact);

  if (
    (!sanitizedName && name) ||
    (!sanitizedNameInMarathi && name_in_marathi) ||
    (!sanitizedDcpName && dcp_name) ||
    (!sanitizedDcpNameInMarathi && dcp_name_in_marathi) ||
    (!sanitizedDcpContact && dcp_contact)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  try {
    const divisiondata = await Zone.findById(Id);

    if (!divisiondata) {
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    divisiondata.name = name;
    divisiondata.name_in_marathi = name_in_marathi;
    divisiondata.dcp_name = dcp_name;
    divisiondata.dcp_name_in_marathi = dcp_name_in_marathi;
    divisiondata.dcp_contact = dcp_contact;

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

const deleteZoneById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    await Zone.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.addZone = addZone;

exports.getZone = getZone;

exports.updateZone = updateZone;

exports.deleteZoneById = deleteZoneById;
