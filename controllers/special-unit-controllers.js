const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
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

const createUnit = async (req, res, next) => {
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
    }).fields([{ name: "photo", maxCount: 1 }]);

    upload(req, res, async function (err) {
      if (err) {
        const error = new HttpError("Error parsing file", 500);
        res.status(500).json({ success: false, message: "Error parsing file" });
        return next(error);
      }

      const imageFile1 = req.files.photo ? req.files.photo[0] : null;

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

      const { name, name_in_marathi, info, info_in_marathi } = req.body;

      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);

      if (
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      const tempGroup = {
        name,
        name_in_marathi,
        info,
        info_in_marathi,
      };

      if (imageFile1) {
        tempGroup.photo = imageLink1;
      }

      const createdGroup = new SpecialUnit(tempGroup);

      await createdGroup.save();

      res.status(201).json({
        success: true,
        message: "New special unit created successfully!",
        createdGroup,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const updateUnit = async (req, res, next) => {
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
    }).fields([{ name: "photo", maxCount: 1 }]);

    upload(req, res, async function (err) {
      if (err) {
        const error = new HttpError("Error parsing file", 500);
        res.status(500).json({ success: false, message: "Error parsing file" });
        return next(error);
      }

      const imageFile1 = req.files.photo ? req.files.photo[0] : null;

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

      const { name, name_in_marathi, info, info_in_marathi } = req.body;

      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);

      if (
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      const tempGroup = await SpecialUnit.findById(Id);

      if (!tempGroup) {
        return res
          .status(400)
          .json({ success: false, message: "unit not found!" });
      }

      if (tempGroup.photo && imageFile1) {
        const s3DeleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: tempGroup.photo.substring(tempGroup.photo.lastIndexOf("/") + 1), // Extract the filename from the URL
        };

        const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
        await s3.send(deleteCommand);
      }

      if (imageFile1) {
        tempGroup.photo = imageLink1;
      }

      if (name) {
        tempGroup.name = name;
      }
      if (name_in_marathi) {
        tempGroup.name_in_marathi = name_in_marathi;
      }
      if (info) {
        tempGroup.info = info;
      }
      if (info_in_marathi) {
        tempGroup.info_in_marathi = info_in_marathi;
      }

      await tempGroup.save();

      res.status(201).json({
        success: true,
        message: "special unit updated successfully!",
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getUnits = async (req, res, next) => {
  let units;

  try {
    units = await SpecialUnit.find({}).sort({ createdAt: 1 });

    res.status(200).json({ units });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const deleteUnitById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const tempGroup = await SpecialUnit.findById(Id);

    if (tempGroup.photo) {
      const s3DeleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: tempGroup.photo.substring(tempGroup.photo.lastIndexOf("/") + 1), // Extract the filename from the URL
      };

      const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
      await s3.send(deleteCommand);
    }

    await SpecialUnit.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getUnitbyId = async (req, res, next) => {
  try {
    const { Id } = req.query;

    const group = await SpecialUnit.findById(Id);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "unit not found!" });
    }

    // const officers = await Officer.find({ psId: Id });

    res.json({ group });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.createUnit = createUnit;

exports.updateUnit = updateUnit;

exports.deleteUnitById = deleteUnitById;

exports.getUnits = getUnits;

exports.getUnitbyId = getUnitbyId;
