const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const Hero = require("../models/hero");

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer"); // For handling file uploads
const path = require("path");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const s3 = new S3Client({
  region: process.env.YOUR_AWS_REGION,
  credentials: {
    accessKeyId: process.env.YOUR_ACCESS_KEY_ID,
    secretAccessKey: process.env.YOUR_SECRET_ACCESS_KEY,
  },
});

const addHero = async (req, res, next) => {
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
        // Generate a unique filename for the uploaded image (you can adjust this as needed)
        const filename = `${uuidv4()}${path.extname(imageFile.originalname)}`;

        // Upload the image file to S3 and get the unique file link.
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: filename,
          Body: imageFile.buffer,
          ContentType: imageFile.mimetype,
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

        imagelink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
      }

      const {
        name,
        name_in_marathi,
        year,
        post,
        post_in_marathi,
        medal_type,
        groupId,
      } = req.body;

      // Now you can store the S3 file URL in your database

      const tempdata = {
        name,
        name_in_marathi,
        photo: imagelink,
        post,
        post_in_marathi,
      };

      if (year) {
        tempdata.year = year;
      }

      if (medal_type) {
        tempdata.medal_type = medal_type;
      }
      if (groupId) {
        tempdata.groupId = groupId;
      }

      const createdImage = new Hero(tempdata);

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

const updateHero = async (req, res, next) => {
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
        name,
        name_in_marathi,
        year,
        post,
        post_in_marathi,
        medal_type,
        groupId,
      } = req.body;

      const tempGroup = await Hero.findById(Id);

      if (!tempGroup) {
        return res
          .status(400)
          .json({ success: false, message: "hero not found!" });
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

      if (year) {
        tempGroup.year = year;
      }

      if (name) {
        tempGroup.name = name;
      }
      if (name_in_marathi) {
        tempGroup.name_in_marathi = name_in_marathi;
      }

      if (post) {
        tempGroup.post = post;
      }
      if (post_in_marathi) {
        tempGroup.post_in_marathi = post_in_marathi;
      }

      if (medal_type) {
        tempGroup.medal_type = medal_type;
      }
      if (groupId) {
        tempGroup.groupId = groupId;
      }

      await tempGroup.save();

      res.status(201).json({
        success: true,
        message: "Hero data updated successfully!",
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

const getHeroData = async (req, res, next) => {
  let Data;

  try {
    Data = await Hero.find({}).sort({ sr_no: 1 });

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

const deleteHeroData = async (req, res, next) => {
  try {
    const { Id } = req.query;
    // console.log(id);

    // Find the record in MongoDB by its ID
    const record = await Hero.findById(Id);

    if (!record) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    if (record.photo) {
      const s3DeleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: record.photo.substring(record.photo.lastIndexOf("/") + 1), // Extract the filename from the URL
      };

      const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
      await s3.send(deleteCommand);
    }

    // Delete the record from MongoDB
    await Hero.findByIdAndDelete(Id);

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

exports.addHero = addHero;

exports.updateHero = updateHero;

exports.getHeroData = getHeroData;

exports.deleteHeroData = deleteHeroData;
