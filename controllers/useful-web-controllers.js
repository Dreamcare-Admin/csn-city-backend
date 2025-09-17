const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const Usefulweb = require("../models/usefulweb");

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

require("dotenv").config();

const addwebsite = async (req, res, next) => {
  const { title, titleInMarathi, link, priority } = req.body;

  const sanitizedTitle = DOMPurify.sanitize(title);
  const sanitizedTitleInMarathi = DOMPurify.sanitize(titleInMarathi);
  const sanitizedLink = DOMPurify.sanitize(link);
  const sanitizedPriority = DOMPurify.sanitize(priority);

  if (
    (!sanitizedTitle && title) ||
    (!sanitizedTitleInMarathi && titleInMarathi) ||
    (!sanitizedLink && link) ||
    (!sanitizedPriority && priority)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  const tempdata = {
    title,
    titleInMarathi,
    link,
  };
  if (priority) {
    tempdata.priority = priority;
  }

  const createdlink = new Usefulweb(tempdata);

  try {
    await createdlink.save();

    res
      .status(201)
      .json({ success: true, message: "new link added successfully!" });
  } catch (err) {
    // console.log(err);
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const getusefulsite = async (req, res, next) => {
  let sites;

  try {
    sites = await Usefulweb.find({}).sort({ priority: -1 });

    res.status(200).json({ sites });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const updatelink = async (req, res, next) => {
  const { Id } = req.query;

  const { title, titleInMarathi, link, priority } = req.body;

  const sanitizedTitle = DOMPurify.sanitize(title);
  const sanitizedTitleInMarathi = DOMPurify.sanitize(titleInMarathi);
  const sanitizedLink = DOMPurify.sanitize(link);
  const sanitizedPriority = DOMPurify.sanitize(priority);

  if (
    (!sanitizedTitle && title) ||
    (!sanitizedTitleInMarathi && titleInMarathi) ||
    (!sanitizedLink && link) ||
    (!sanitizedPriority && priority)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  try {
    // Find the teacher by their ID
    const sitelink = await Usefulweb.findById(Id);

    if (!sitelink) {
      //   const error = new HttpError("Teacher not found.", 404);
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    // Update the teacher's properties
    sitelink.title = title;
    sitelink.titleInMarathi = titleInMarathi;
    sitelink.link = link;
    if (priority) {
      sitelink.priority = priority;
    }

    // Save the updated teacher
    await sitelink.save();

    res
      .status(200)
      .json({ success: true, message: "link data updated successfully!" });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "Something went wrong" });
    return next(error);
  }
};

const deletelinkById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    await Usefulweb.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "Something went wrong" });
    return next(error);
  }
};

exports.addwebsite = addwebsite;

exports.getusefulsite = getusefulsite;

exports.updatelink = updatelink;

exports.deletelinkById = deletelinkById;
