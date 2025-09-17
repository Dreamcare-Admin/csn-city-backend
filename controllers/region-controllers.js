const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const Region = require("../models/region");

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

require("dotenv").config();

const addRegion = async (req, res, next) => {
  const {
    name,
    name_in_marathi,
    racp_name,
    racp_name_in_marathi,
    racp_contact,
  } = req.body;

  const sanitizedName = DOMPurify.sanitize(name);
  const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
  const sanitizedRacpName = DOMPurify.sanitize(racp_name);
  const sanitizedRacpNameInMarathi = DOMPurify.sanitize(racp_name_in_marathi);
  const sanitizedRacpContact = DOMPurify.sanitize(racp_contact);

  if (
    (!sanitizedName && name) ||
    (!sanitizedNameInMarathi && name_in_marathi) ||
    (!sanitizedRacpName && racp_name) ||
    (!sanitizedRacpNameInMarathi && racp_name_in_marathi) ||
    (!sanitizedRacpContact && racp_contact)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  const createdRegion = new Region({
    name,
    name_in_marathi,
    racp_name,
    racp_name_in_marathi,
    racp_contact,
  });

  try {
    await createdRegion.save();
    res
      .status(201)
      .json({ success: true, message: "new Region added successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getRegion = async (req, res, next) => {
  let Regions;

  try {
    Regions = await Region.find({}).sort({ createdAt: -1 });

    res.status(200).json({ Regions });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const updateRegion = async (req, res, next) => {
  const { Id } = req.query;

  const {
    name,
    name_in_marathi,
    sr_no,
    racp_name,
    racp_name_in_marathi,
    racp_contact,
  } = req.body;

  const sanitizedName = DOMPurify.sanitize(name);
  const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
  const sanitizedRacpName = DOMPurify.sanitize(racp_name);
  const sanitizedRacpNameInMarathi = DOMPurify.sanitize(racp_name_in_marathi);
  const sanitizedRacpContact = DOMPurify.sanitize(racp_contact);
  const sanitizedSR_no = DOMPurify.sanitize(sr_no);

  if (
    (!sanitizedName && name) ||
    (!sanitizedNameInMarathi && name_in_marathi) ||
    (!sanitizedRacpName && racp_name) ||
    (!sanitizedRacpNameInMarathi && racp_name_in_marathi) ||
    (!sanitizedRacpContact && racp_contact) ||
    (!sanitizedSR_no && sr_no)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  try {
    const Regiondata = await Region.findById(Id);

    if (!Regiondata) {
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    Regiondata.name = name;
    Regiondata.name_in_marathi = name_in_marathi;
    Regiondata.sr_no = sr_no;
    Regiondata.racp_name = racp_name;
    Regiondata.racp_name_in_marathi = racp_name_in_marathi;
    Regiondata.racp_contact = racp_contact;

    await Regiondata.save();

    res
      .status(200)
      .json({ success: true, message: "data updated successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteRegionById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    await Region.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.addRegion = addRegion;

exports.getRegion = getRegion;

exports.updateRegion = updateRegion;

exports.deleteRegionById = deleteRegionById;
