const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Headline = require("../models/headline");

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

const s3 = new S3Client({
  region: process.env.YOUR_AWS_REGION,
  credentials: {
    accessKeyId: process.env.YOUR_ACCESS_KEY_ID,
    secretAccessKey: process.env.YOUR_SECRET_ACCESS_KEY,
  },
});

const addRecordWithText = async (req, res, next) => {
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
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  const temp = {
    title,
    title_in_marathi,
    file_type,
  };

  if (value) {
    temp.value = value;
  }

  const createdRecord = new Headline(temp);

  try {
    await createdRecord.save();

    res.status(201).json({
      success: true,
      message: "new headline created successfully!",
    });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const addRecordWithFile = async (req, res, next) => {
  try {
    // Use multer to parse the 'pdf' file from the request
    const storage = multer.memoryStorage();
    const upload = multer({ storage }).single("pdf");

    upload(req, res, async function (err) {
      if (err) {
        // Handle parsing error here
        console.error(err);
        const error = new HttpError("Error parsing file", 500);
        return next(error);
      }

      // req.file should now contain the 'pdf' file
      const pdfFile = req.file;

      if (!pdfFile) {
        const error = new HttpError("PDF file is missing", 400);
        return next(error);
      }

      // Generate a unique filename for the uploaded file (you can adjust this as needed)
      const filename = `${uuidv4()}.pdf`;

      // Upload the PDF file to S3 and get the unique file link.
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: pdfFile.buffer,
        ContentDisposition: "inline",
        ContentType: "application/pdf",
      };

      const uploadCommand = new PutObjectCommand(uploadParams);
      const uploadResult = await s3.send(uploadCommand); // Corrected

      if (
        !uploadResult.$metadata.httpStatusCode ||
        uploadResult.$metadata.httpStatusCode !== 200
      ) {
        // Handle the S3 upload error here
        throw new Error("S3 file upload failed");
      }

      const { title, title_in_marathi } = req.body;

      const sanitizedTitle = DOMPurify.sanitize(title);
      const sanitizedTitleInMarathi = DOMPurify.sanitize(title_in_marathi);

      if (
        (!sanitizedTitle && title) ||
        (!sanitizedTitleInMarathi && title_in_marathi)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      // Now you can store the S3 file URL in your database
      const pdflink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;

      const tempdata = {
        title,
        title_in_marathi,
        file_type: "pdf",
        value: pdflink,
      };

      const createdRecord = new Headline(tempdata);

      await createdRecord.save();

      res.status(201).json({
        success: true,
        message: "new headline created successfully!",
      });
    });
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

const deleteRecordById = async (req, res, next) => {
  try {
    const { id } = req.query;
    // console.log(id);

    // Find the record in MongoDB by its ID
    const record = await Headline.findById(id);

    if (!record) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    if (record.file_type === "pdf") {
      // Delete the corresponding PDF file from S3
      const s3DeleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: record.value.substring(record.value.lastIndexOf("/") + 1), // Extract the filename from the URL
      };

      const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
      await s3.send(deleteCommand);
    }

    // Delete the record from MongoDB
    await Headline.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Record deleted successfully",
    });
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

const getRecordall = async (req, res, next) => {
  let records;

  try {
    records = await Headline.find({}).sort({ createdAt: -1 });

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

//new routes

exports.addRecordWithText = addRecordWithText;

exports.addRecordWithFile = addRecordWithFile;

exports.deleteRecordById = deleteRecordById;

exports.getRecordall = getRecordall;

exports.getRecordThree = getRecordThree;
