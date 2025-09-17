const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const FormerCP = require("../models/formerCP");

const {
  uploadPdfToS3,
  uploadImageToS3,
  deleteObjectFromS3,
} = require("../utils/upload-to-s3");
const multer = require("multer"); // For handling file uploads
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

require("dotenv").config();

const addformerADG = async (req, res, next) => {
  let imagelink;
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        // Accept only image files with extensions .png, .jpg, and .jpeg
        const allowedExtensions = [".png", ".jpg", ".jpeg"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Invalid file format. Only PNG, JPG, and JPEG files are allowed."
            ),
            false
          );
        }
      },
    }).single("image");

    upload(req, res, async function (err) {
      if (err) {
        // Handle parsing error here
        // console.error(err);
        const error = new HttpError("Error parsing file", 500);
        res.status(500).json({ success: false, message: "Error parsing file" });
        return next(error);
      }

      // req.file should now contain the 'image' file
      const imageFile = req.file;

      if (imageFile) {
        imagelink = await uploadImageToS3(imageFile);
      }

      const {
        sr_no,
        name,
        name_in_marathi,
        designation,
        designation_in_marathi,
        from_date,
        to_date,
      } = req.body;

      const sanitizedSrNo = DOMPurify.sanitize(sr_no);
      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
      const sanitizedDesignation = DOMPurify.sanitize(designation);
      const sanitizedDesignationInMarathi = DOMPurify.sanitize(
        designation_in_marathi
      );
      const sanitizedFromDate = DOMPurify.sanitize(from_date);
      const sanitizedToDate = DOMPurify.sanitize(to_date);

      if (
        (!sanitizedSrNo && sr_no) ||
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi) ||
        (!sanitizedDesignation && designation) ||
        (!sanitizedDesignationInMarathi && designation_in_marathi) ||
        (!sanitizedFromDate && from_date) ||
        (!sanitizedToDate && to_date)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      // Now you can store the S3 file URL in your database

      const tempdata = {
        sr_no,
        name,
        name_in_marathi,
      };

      if (designation) {
        tempdata.designation = designation;
      }
      if (designation_in_marathi) {
        tempdata.designation_in_marathi = designation_in_marathi;
      }

      if (from_date) {
        tempdata.from_date = from_date;
      }
      if (to_date) {
        tempdata.to_date = to_date;
      }
      if (imagelink) {
        tempdata.photo = imagelink;
      }

      const createdImage = new FormerCP(tempdata);

      const Data = await createdImage.save();

      res.status(201).json({
        success: true,
        message: "New data Added successfully!",
        Data,
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

const updateADGdata = async (req, res, next) => {
  const { Id } = req.query;
  let imageLink1;
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        const allowedExtensions = [".png", ".jpg", ".jpeg"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Invalid file format. Only PNG, JPG, and JPEG files are allowed."
            ),
            false
          );
        }
      },
    }).fields([{ name: "image", maxCount: 1 }]);

    upload(req, res, async function (err) {
      if (err) {
        const error = new HttpError("Error parsing file", 500);
        res.status(500).json({ success: false, message: "Error parsing file" });
        return next(error);
      }

      const imageFile1 = req.files.image ? req.files.image[0] : null;

      if (imageFile1) {
        imageLink1 = await uploadImageToS3(imageFile1);
      }

      const {
        sr_no,
        name,
        name_in_marathi,
        designation,
        designation_in_marathi,
        from_date,
        to_date,
      } = req.body;

      const sanitizedSrNo = DOMPurify.sanitize(sr_no);
      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
      const sanitizedDesignation = DOMPurify.sanitize(designation);
      const sanitizedDesignationInMarathi = DOMPurify.sanitize(
        designation_in_marathi
      );
      const sanitizedFromDate = DOMPurify.sanitize(from_date);
      const sanitizedToDate = DOMPurify.sanitize(to_date);

      if (
        (!sanitizedSrNo && sr_no) ||
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi) ||
        (!sanitizedDesignation && designation) ||
        (!sanitizedDesignationInMarathi && designation_in_marathi) ||
        (!sanitizedFromDate && from_date) ||
        (!sanitizedToDate && to_date)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      const tempGroup = await FormerCP.findById(Id);

      if (!tempGroup) {
        return res
          .status(400)
          .json({ success: false, message: "adg not found!" });
      }

      if (tempGroup.photo && imageFile1) {
        await deleteObjectFromS3(tempGroup.photo);
      }

      if (imageFile1) {
        tempGroup.photo = imageLink1;
      }

      if (sr_no) {
        tempGroup.sr_no = sr_no;
      }

      if (name) {
        tempGroup.name = name;
      }
      if (name_in_marathi) {
        tempGroup.name_in_marathi = name_in_marathi;
      }

      if (designation) {
        tempGroup.designation = designation;
      }
      if (designation_in_marathi) {
        tempGroup.designation_in_marathi = designation_in_marathi;
      }

      if (from_date) {
        tempGroup.from_date = from_date;
      }
      if (to_date) {
        tempGroup.to_date = to_date;
      }

      await tempGroup.save();

      res.status(201).json({
        success: true,
        message: "adg data updated successfully!",
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

const getformderADGData = async (req, res, next) => {
  let Data;

  try {
    Data = await FormerCP.find({}).sort({ sr_no: 1 });

    res.status(200).json({ Data });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const deleteADGData = async (req, res, next) => {
  try {
    const { Id } = req.query;
    // console.log(id);

    // Find the record in MongoDB by its ID
    const record = await FormerCP.findById(Id);

    if (!record) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    if (record.photo) {
      await deleteObjectFromS3(record.photo);
    }

    // Delete the record from MongoDB
    await FormerCP.findByIdAndDelete(Id);

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

exports.addformerADG = addformerADG;

exports.updateADGdata = updateADGdata;

exports.getformderADGData = getformderADGData;

exports.deleteADGData = deleteADGData;
