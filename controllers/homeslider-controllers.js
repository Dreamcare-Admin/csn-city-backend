const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const Slider = require("../models/slider");
const Image = require("../models/image");

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

const addSliderImage = async (req, res, next) => {
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        // Accept only image files with extensions .png, .jpg, and .jpeg
        const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Invalid file format. Only PNG, JPG, wepb and JPEG files are allowed."
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

      if (!imageFile) {
        const error = new HttpError("Image file is missing", 400);
        return next(error);
      }

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

      // Now you can store the S3 file URL in your database
      const imagelink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;

      const tempdata = {
        imagelink,
      };

      const createdImage = new Slider(tempdata);

      const tempimage = await createdImage.save();

      res.status(201).json({
        success: true,
        message: "New slider image created successfully!",
        tempimage,
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

const deleteSliderImageById = async (req, res, next) => {
  try {
    const { id } = req.query;
    // console.log(id);

    // Find the record in MongoDB by its ID
    const image = await Slider.findById(id);

    if (!image) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    // Delete the corresponding PDF file from S3
    const s3DeleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: image.imagelink.substring(image.imagelink.lastIndexOf("/") + 1), // Extract the filename from the URL
    };

    const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
    await s3.send(deleteCommand);

    // Delete the record from MongoDB
    await Slider.findByIdAndDelete(id);

    res.json({ success: true, message: "Record deleted successfully" });
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

const getSliderImages = async (req, res, next) => {
  let images;

  try {
    images = await Slider.find({}).sort({ createdAt: -1 });

    res.status(200).json({ success: true, slider: images });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const getSliderImagespublic = async (req, res, next) => {
  try {
    const sliders = await Slider.find({}, "imagelink").sort({ createdAt: -1 }); // Retrieve only the imagelink field

    const imageLinks = sliders.map((slider) => slider.imagelink);

    res.status(200).json({ success: true, imageLinks: imageLinks });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

exports.addSliderImage = addSliderImage;

exports.deleteSliderImageById = deleteSliderImageById;

exports.getSliderImages = getSliderImages;

exports.getSliderImagespublic = getSliderImagespublic;
