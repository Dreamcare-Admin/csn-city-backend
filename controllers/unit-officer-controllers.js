const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const UnitOfficer = require("../models/special-unit-officer");
const SpecialUnit = require("../models/special-unit");

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

const createOfficer = async (req, res, next) => {
  let imageLink1;
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
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
    }).fields([{ name: "officer_photo", maxCount: 1 }]);

    upload(req, res, async function (err) {
      if (err) {
        const error = new HttpError("Error parsing file", 500);
        res.status(500).json({ success: false, message: "Error parsing file" });
        return next(error);
      }

      const imageFile1 = req.files.officer_photo
        ? req.files.officer_photo[0]
        : null;

      // Function to upload a file to S3
      const uploadToS3 = async (file) => {
        const filename = `${uuidv4()}${path.extname(file.originalname)}`;
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadCommand = new PutObjectCommand(uploadParams);
        await s3.send(uploadCommand);
        return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
      };

      if (imageFile1) {
        imageLink1 = await uploadToS3(imageFile1);
      }

      const {
        unitId,
        name,
        name_in_marathi,
        date_of_joining,
        post,
        post_in_marathi,
        contact_no,
        email,
        priority,
      } = req.body;

      const sanitizedUnitId = DOMPurify.sanitize(unitId);
      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
      const sanitizedDateOfJoining = DOMPurify.sanitize(date_of_joining);
      const sanitizedPost = DOMPurify.sanitize(post);
      const sanitizedPostInMarathi = DOMPurify.sanitize(post_in_marathi);
      const sanitizedContactNo = DOMPurify.sanitize(contact_no);
      const sanitizedEmail = DOMPurify.sanitize(email);
      const sanitizedPriority = DOMPurify.sanitize(priority);

      if (
        (!sanitizedUnitId && unitId) ||
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi) ||
        (!sanitizedDateOfJoining && date_of_joining) ||
        (!sanitizedPost && post) ||
        (!sanitizedPostInMarathi && post_in_marathi) ||
        (!sanitizedContactNo && contact_no) ||
        (!sanitizedEmail && email) ||
        (!sanitizedPriority && priority)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      const tempGroup = {
        name,
        name_in_marathi,
        unitId,
      };

      if (imageFile1) {
        tempGroup.officer_photo = imageLink1;
      }

      if (date_of_joining) {
        tempGroup.date_of_joining = date_of_joining;
      }

      if (post) {
        tempGroup.post = post;
      }

      if (post_in_marathi) {
        tempGroup.post_in_marathi = post_in_marathi;
      }

      if (contact_no) {
        tempGroup.contact_no = contact_no;
      }

      if (email) {
        tempGroup.email = email;
      }
      if (priority) {
        tempGroup.priority = priority;
      }

      const createdGroup = new UnitOfficer(tempGroup);

      await createdGroup.save();

      res.status(201).json({
        success: true,
        message: "New Officer created successfully!",
        createdGroup,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const updateOfficer = async (req, res, next) => {
  const { Id } = req.query;
  let imageLink1;
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
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
    }).fields([{ name: "officer_photo", maxCount: 1 }]);

    upload(req, res, async function (err) {
      if (err) {
        const error = new HttpError("Error parsing file", 500);
        res.status(500).json({ success: false, message: "Error parsing file" });
        return next(error);
      }

      const imageFile1 = req.files.officer_photo
        ? req.files.officer_photo[0]
        : null;

      // Function to upload a file to S3
      const uploadToS3 = async (file) => {
        const filename = `${uuidv4()}${path.extname(file.originalname)}`;
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadCommand = new PutObjectCommand(uploadParams);
        await s3.send(uploadCommand);
        return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
      };

      if (imageFile1) {
        imageLink1 = await uploadToS3(imageFile1);
      }

      const {
        unitId,
        name,
        name_in_marathi,
        date_of_joining,
        post,
        post_in_marathi,
        contact_no,
        email,
        priority,
      } = req.body;

      const sanitizedUnitId = DOMPurify.sanitize(unitId);
      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
      const sanitizedDateOfJoining = DOMPurify.sanitize(date_of_joining);
      const sanitizedPost = DOMPurify.sanitize(post);
      const sanitizedPostInMarathi = DOMPurify.sanitize(post_in_marathi);
      const sanitizedContactNo = DOMPurify.sanitize(contact_no);
      const sanitizedEmail = DOMPurify.sanitize(email);
      const sanitizedPriority = DOMPurify.sanitize(priority);

      if (
        (!sanitizedUnitId && unitId) ||
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi) ||
        (!sanitizedDateOfJoining && date_of_joining) ||
        (!sanitizedPost && post) ||
        (!sanitizedPostInMarathi && post_in_marathi) ||
        (!sanitizedContactNo && contact_no) ||
        (!sanitizedEmail && email) ||
        (!sanitizedPriority && priority)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      const tempGroup = await UnitOfficer.findById(Id);

      if (!tempGroup) {
        return res
          .status(400)
          .json({ success: false, message: "officer not found!" });
      }

      if (tempGroup.officer_photo && imageFile1) {
        const s3DeleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: tempGroup.officer_photo.substring(
            tempGroup.officer_photo.lastIndexOf("/") + 1
          ), // Extract the filename from the URL
        };

        const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
        await s3.send(deleteCommand);
      }

      if (imageFile1) {
        tempGroup.officer_photo = imageLink1;
      }
      if (name) {
        tempGroup.name = name;
      }
      if (name_in_marathi) {
        tempGroup.name_in_marathi = name_in_marathi;
      }
      if (unitId) {
        tempGroup.unitId = unitId;
      }

      if (date_of_joining) {
        tempGroup.date_of_joining = date_of_joining;
      }

      if (post) {
        tempGroup.post = post;
      }

      if (post_in_marathi) {
        tempGroup.post_in_marathi = post_in_marathi;
      }

      if (contact_no) {
        tempGroup.contact_no = contact_no;
      }

      if (email) {
        tempGroup.email = email;
      }
      if (priority) {
        tempGroup.priority = priority;
      }

      await tempGroup.save();

      res.status(201).json({
        success: true,
        message: "officer updated successfully!",
        tempGroup,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getOfficersAdmin = async (req, res, next) => {
  let Officers;

  try {
    Officers = await UnitOfficer.find({}).populate({
      path: "unitId",
      select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
    });
    //   .sort({ priority: -1 });
    res.status(200).json({ Officers });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getUnitOfficersbyUnit = async (req, res, next) => {
  let Officers;
  const { Id } = req.query;

  try {
    const unitdata = await SpecialUnit.findById(Id);

    if (!unitdata) {
      return res
        .status(404)
        .json({ success: false, message: "unit not found" });
    }

    Officers = await UnitOfficer.find({ unitId: Id }).sort({ priority: -1 });

    res.status(200).json({
      Officers,
      name: unitdata.name,
      name_in_marathi: unitdata.name_in_marathi,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const deleteOfficerById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const tempGroup = await UnitOfficer.findById(Id);

    if (tempGroup.officer_photo) {
      const s3DeleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: tempGroup.officer_photo.substring(
          tempGroup.officer_photo.lastIndexOf("/") + 1
        ), // Extract the filename from the URL
      };

      const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
      await s3.send(deleteCommand);
    }

    await UnitOfficer.findByIdAndDelete(Id);

    res.json({ success: true, message: "Officer data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.createOfficer = createOfficer;

exports.updateOfficer = updateOfficer;

exports.getOfficersAdmin = getOfficersAdmin;

exports.deleteOfficerById = deleteOfficerById;

exports.getUnitOfficersbyUnit = getUnitOfficersbyUnit;
