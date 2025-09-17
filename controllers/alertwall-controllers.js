const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Alertwall = require("../models/alertwall");
const {
  uploadImageToS3,
  uploadPdfToS3,
  deleteObjectFromS3,
} = require("../utils/upload-to-s3");

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer"); // For handling file uploads
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

require("dotenv").config();

const addRecordWithFile = async (req, res, next) => {
  let pdflink, imagelink, tempdata;
  try {
    // Use multer to parse the 'pdf' file from the request
    const storage = multer.memoryStorage();
    const upload = multer({ storage }).single("file");

    upload(req, res, async function (err) {
      if (err) {
        // Handle parsing error here
        // console.error(err);
        const error = new HttpError("Error parsing file", 500);
        return next(error);
      }

      const File = req.file;

      const { title, title_in_marathi, value, tag, file_type } = req.body;

      const sanitizedTitle = DOMPurify.sanitize(title);
      const sanitizedTitleInMarathi = DOMPurify.sanitize(title_in_marathi);
      const sanitizedValue = DOMPurify.sanitize(value);
      const sanitizedTag = DOMPurify.sanitize(tag);
      const sanitizedFileType = DOMPurify.sanitize(file_type);

      if (
        (!sanitizedTitle && title) ||
        (!sanitizedTitleInMarathi && title_in_marathi) ||
        (!sanitizedValue && value) ||
        (!sanitizedTag && tag) ||
        (!sanitizedFileType && file_type)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      if (file_type === "pdf") {
        pdflink = await uploadPdfToS3(File);
        tempdata = {
          title: title,
          title_in_marathi: title_in_marathi,
          file_type: "pdf",
          value: pdflink,
          tag: tag,
        };
      } else if (file_type === "image") {
        imagelink = await uploadImageToS3(File);
        tempdata = {
          title: title,
          title_in_marathi: title_in_marathi,
          file_type: "image",
          value: imagelink,
          tag: tag,
        };
      } else if (file_type === "text") {
        tempdata = {
          title: title,
          title_in_marathi: title_in_marathi,
          file_type: "text",
          tag: tag,
        };
      } else if (file_type === "link") {
        tempdata = {
          title: title,
          title_in_marathi: title_in_marathi,
          file_type: "link",
          value: value,
          tag: tag,
        };
      } else if (file_type === "youtube") {
        tempdata = {
          title: title,
          title_in_marathi: title_in_marathi,
          file_type: "youtube",
          value: value,
          tag: tag,
        };
      }

      const createdRecord = new Alertwall(tempdata);

      await createdRecord.save();

      res.status(201).json({
        success: true,
        message: "new record created successfully!",
        createdRecord,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteRecordById = async (req, res, next) => {
  try {
    const { id } = req.query;
    // console.log(id);

    // Find the record in MongoDB by its ID
    const record = await Alertwall.findById(id);

    if (!record) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    if (record.file_type === "pdf" || record.file_type === "image") {
      await deleteObjectFromS3(record.value);
    }

    // Delete the record from MongoDB
    await Alertwall.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const updateRecordById = async (req, res, next) => {
  let pdflink, imagelink;
  const { id } = req.query;
  try {
    // Use multer to parse the 'pdf' file from the request
    const storage = multer.memoryStorage();
    const upload = multer({ storage }).single("file");

    upload(req, res, async function (err) {
      if (err) {
        // Handle parsing error here
        const error = new HttpError("Error parsing file", 500);
        return next(error);
      }

      const File = req.file;

      // Find the record in MongoDB by its ID
      const record = await Alertwall.findById(id);

      if (!record) {
        const error = new HttpError("Record not found", 404);
        return next(error);
      }

      const { title, title_in_marathi, value, file_type } = req.body;

      const sanitizedTitle = DOMPurify.sanitize(title);
      const sanitizedTitleInMarathi = DOMPurify.sanitize(title_in_marathi);
      const sanitizedValue = DOMPurify.sanitize(value);

      const sanitizedFileType = DOMPurify.sanitize(file_type);

      if (
        (!sanitizedTitle && title) ||
        (!sanitizedTitleInMarathi && title_in_marathi) ||
        (!sanitizedValue && value) ||
        (!sanitizedFileType && file_type)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      if (file_type === "pdf") {
        if (File) {
          pdflink = await uploadPdfToS3(File);
          await deleteObjectFromS3(record.value);
          record.value = pdflink;
        }

        record.title = title;
        record.title_in_marathi = title_in_marathi;
      } else if (file_type === "image") {
        if (File) {
          imagelink = await uploadImageToS3(File);

          await deleteObjectFromS3(record.value);
          record.value = imagelink;
        }

        record.title = title;
        record.title_in_marathi = title_in_marathi;
      } else if (file_type === "text") {
        record.title = title;
        record.title_in_marathi = title_in_marathi;
      } else if (file_type === "link" || file_type === "youtube") {
        record.title = title;
        record.title_in_marathi = title_in_marathi;
        record.value = value;
      }

      await record.save();

      res.status(201).json({
        success: true,
        message: "record updated successfully!",
        record: record, // return the updated record
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getRecordbyTag = async (req, res, next) => {
  let records;

  const { tag } = req.query;

  try {
    records = await Alertwall.find({ tag: tag }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, records: records });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getRecordThree = async (req, res, next) => {
  let records;

  try {
    records = await Headline.find({ s: s }).sort({ createdAt: -1 }).limit(3);

    res.status(200).json({ records });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

exports.addRecordWithFile = addRecordWithFile;

exports.deleteRecordById = deleteRecordById;

exports.updateRecordById = updateRecordById;

exports.getRecordbyTag = getRecordbyTag;

exports.getRecordThree = getRecordThree;
