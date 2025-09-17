const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const SPMessage = require("../models/sp-message");

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

const addMessageData = async (req, res, next) => {
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

      const {
        name,
        name_in_marathi,
        post,
        post_in_marathi,
        message,
        message_in_marathi,
        tag,
      } = req.body;

      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
      const sanitizedPost = DOMPurify.sanitize(post);
      const sanitizedPostInMarathi = DOMPurify.sanitize(post_in_marathi);
      const sanitizedMessage = DOMPurify.sanitize(message);
      const sanitizedMessageInMarathi = DOMPurify.sanitize(message_in_marathi);
      const sanitizedTag = DOMPurify.sanitize(tag);

      if (
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi) ||
        (!sanitizedPost && post) ||
        (!sanitizedPostInMarathi && post_in_marathi) ||
        (!sanitizedMessage && message) ||
        (!sanitizedMessageInMarathi && message_in_marathi) ||
        (!sanitizedTag && tag)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      // Now you can store the S3 file URL in your database
      const imagelink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;

      const createdImage = new SPMessage({
        name,
        name_in_marathi,
        post,
        post_in_marathi,
        message,
        message_in_marathi,
        photo: imagelink,
        tag,
      });

      const MessageData = await createdImage.save();

      res.status(201).json({
        success: true,
        message: "New message data created successfully!",
        MessageData,
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

const updateMessageData = async (req, res, next) => {
  const { Id } = req.query;
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

        // Now you can store the S3 file URL in your database
        imagelink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
      }

      let datatemp = await SPMessage.findById(Id);

      if (!datatemp) {
        const error = new HttpError("Principal data not found", 404);
        return next(error);
      }

      const {
        name,
        name_in_marathi,
        post,
        post_in_marathi,
        message,
        message_in_marathi,
      } = req.body;

      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
      const sanitizedPost = DOMPurify.sanitize(post);
      const sanitizedPostInMarathi = DOMPurify.sanitize(post_in_marathi);
      const sanitizedMessage = DOMPurify.sanitize(message);
      const sanitizedMessageInMarathi = DOMPurify.sanitize(message_in_marathi);

      if (
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi) ||
        (!sanitizedPost && post) ||
        (!sanitizedPostInMarathi && post_in_marathi) ||
        (!sanitizedMessage && message) ||
        (!sanitizedMessageInMarathi && message_in_marathi)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      const oldimage = datatemp.photo;

      //   if file exists then delete the old one

      if (imageFile) {
        const s3DeleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: oldimage.substring(oldimage.lastIndexOf("/") + 1), // Extract the filename from the URL
        };

        const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
        await s3.send(deleteCommand);
      }

      datatemp.name = name;
      datatemp.name_in_marathi = name_in_marathi;
      datatemp.post = post;
      datatemp.post_in_marathi = post_in_marathi;
      datatemp.message = message;
      datatemp.message_in_marathi = message_in_marathi;

      if (imageFile) {
        datatemp.photo = imagelink;
      }

      await datatemp.save();

      res.status(201).json({
        success: true,
        message: "Message data updated successfully!",
        datatemp,
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

const getMessageData = async (req, res, next) => {
  let MessageData;
  const { tag } = req.query;

  try {
    MessageData = await SPMessage.find({ tag: tag });

    res.status(200).json({ data: MessageData[0] });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

exports.addMessageData = addMessageData;

exports.updateMessageData = updateMessageData;

exports.getMessageData = getMessageData;
