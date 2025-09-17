const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Record = require("../models/record");
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

const addRecord = async (req, res, next) => {
  try {
    // Use multer to parse the 'pdf' file from the request
    const storage = multer.memoryStorage();
    const upload = multer({ storage }).single("pdf");

    upload(req, res, async function (err) {
      if (err) {
        // Handle parsing error here
        // console.error(err);
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

      const { date, title, titleInMarathi, tag, createdAt } = req.body;

      const sanitizedDate = DOMPurify.sanitize(date);
      const sanitizedTitle = DOMPurify.sanitize(title);
      const sanitizedTitleInMarathi = DOMPurify.sanitize(titleInMarathi);
      const sanitizedTag = DOMPurify.sanitize(tag);
      const sanitizedCreatedAt = DOMPurify.sanitize(createdAt);

      if (
        (!sanitizedDate && date) ||
        (!sanitizedTitle && title) ||
        (!sanitizedTitleInMarathi && titleInMarathi) ||
        (!sanitizedTag && tag) ||
        (!sanitizedCreatedAt && createdAt)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }
      //   console.log(req.body);

      // Now you can store the S3 file URL in your database
      const pdflink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;

      const tempdata = {
        title,
        titleInMarathi,
        tag,
        pdflink,
      };
      if (createdAt) {
        tempdata.createdAt = createdAt;
      }

      if (date) {
        tempdata.date = date;
      }

      const createdRecord = new Record(tempdata);

      await createdRecord.save();

      res
        .status(201)
        .json({ success: true, message: "new record created successfully!" });
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
    const record = await Record.findById(id);

    if (!record) {
      return res
        .status(400)
        .json({ success: false, message: "Record not found!" });
    }

    // Delete the corresponding PDF file from S3
    const s3DeleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: record.pdflink.substring(record.pdflink.lastIndexOf("/") + 1), // Extract the filename from the URL
    };

    const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
    await s3.send(deleteCommand);

    // Delete the record from MongoDB
    await Record.findByIdAndDelete(id);

    res.json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// const getRecordbyTag = async (req, res, next) => {
//   const { tag } = req.query;
//   let records;

//   try {
//     records = await Record.find({ tag: tag }).sort({
//       createdAt: -1,
//     });

//     res.status(200).json({ success: true, records: records });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "something went wrong" });
//   }
// };

const getRecordbyTag = async (req, res, next) => {
  const { tag, page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  try {
    const totalRecords = await Record.countDocuments({ tag: tag });
    const totalPages = Math.ceil(totalRecords / limitNumber);

    const records = await Record.find({ tag: tag })
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      records: records,
      currentPage: pageNumber,
      totalPages: totalPages,
      totalRecords: totalRecords,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getLatestThreeRecords = async (req, res, next) => {
  let records;

  try {
    records = await Record.find({}).sort({ createdAt: -1 }).limit(5);

    res.status(200).json({ success: true, records: records });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const updateRecord = async (req, res, next) => {
  const { recordId } = req.query; // Assuming you pass the record ID in the URL
  //   console.log(recordId);
  try {
    // Find the record to be updated in the database
    const recordToUpdate = await Record.findById(recordId);

    if (!recordToUpdate) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    // Check if a new PDF file is uploaded, similar to the addTender code
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

      // Update the S3 file and URL if a new PDF is uploaded
      if (pdfFile) {
        // Generate a unique filename for the uploaded file (you can adjust this as needed)
        const filename = `${uuidv4()}.pdf`;

        // Upload the new PDF file to S3 and get the unique file link.
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: filename,
          Body: pdfFile.buffer,
          ContentDisposition: "inline",
          ContentType: "application/pdf",
        };

        const uploadCommand = new PutObjectCommand(uploadParams);
        const uploadResult = await s3.send(uploadCommand);

        if (
          !uploadResult.$metadata.httpStatusCode ||
          uploadResult.$metadata.httpStatusCode !== 200
        ) {
          // Handle the S3 upload error here
          throw new Error("S3 file upload failed");
        }

        // Delete the previous file from S3
        if (recordToUpdate.pdflink) {
          const previousFileKey = recordToUpdate.pdflink.split("/").pop();
          const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: previousFileKey,
          };
          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await s3.send(deleteCommand);
        }

        // Update the S3 file link in the database
        recordToUpdate.pdflink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
      }

      // Update other fields if needed
      const { date, title, titleInMarathi } = req.body;

      const sanitizedDate = DOMPurify.sanitize(date);
      const sanitizedTitle = DOMPurify.sanitize(title);
      const sanitizedTitleInMarathi = DOMPurify.sanitize(titleInMarathi);

      if (
        (!sanitizedDate && date) ||
        (!sanitizedTitle && title) ||
        (!sanitizedTitleInMarathi && titleInMarathi)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      if (date) recordToUpdate.date = date;
      if (title) recordToUpdate.title = title;
      if (titleInMarathi) recordToUpdate.titleInMarathi = titleInMarathi;
      // Save the updated record
      await recordToUpdate.save();

      res
        .status(200)
        .json({ success: true, message: "Record updated successfully!" });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.addRecord = addRecord;

exports.deleteRecordById = deleteRecordById;

exports.getRecordbyTag = getRecordbyTag;

exports.getLatestThreeRecords = getLatestThreeRecords;

exports.updateRecord = updateRecord;
