const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer"); // For handling file uploads
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Martyrs = require("../models/Martyrs");
const Group = require("../models/Group");

require("dotenv").config();

const s3 = new S3Client({
  region: process.env.YOUR_AWS_REGION,
  credentials: {
    accessKeyId: process.env.YOUR_ACCESS_KEY_ID,
    secretAccessKey: process.env.YOUR_SECRET_ACCESS_KEY,
  },
});

const addMartyrs = async (req, res, next) => {
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
        sr_no,
        name,
        name_in_marathi,
        groupId,
        birth_date,
        joining_date,
        martyrs_date,
        birth_place,
        birth_place_in_marathi,
        father_name,
        father_name_in_marathi,
        area,
        area_in_marathi,
        incident,
        incident_in_marathi,
        post,
        post_in_marathi,
        details,
        details_in_marathi,
      } = req.body;

      // Now you can store the S3 file URL in your database

      const tempdata = {
        name,
        name_in_marathi,
        area,
        area_in_marathi,
        incident,
        incident_in_marathi,
        post,
        post_in_marathi,
      };

      if (sr_no) {
        tempdata.sr_no = sr_no;
      }
      if (groupId) {
        tempdata.groupId = groupId;
      }

      if (birth_date) {
        tempdata.birth_date = birth_date;
      }
      if (joining_date) {
        tempdata.joining_date = joining_date;
      }
      if (martyrs_date) {
        tempdata.martyrs_date = martyrs_date;
      }
      if (birth_place) {
        tempdata.birth_place = birth_place;
      }
      if (birth_place_in_marathi) {
        tempdata.birth_place_in_marathi = birth_place_in_marathi;
      }
      if (father_name) {
        tempdata.father_name = father_name;
      }
      if (father_name_in_marathi) {
        tempdata.father_name_in_marathi = father_name_in_marathi;
      }
      if (details) {
        tempdata.details = details;
      }
      if (details_in_marathi) {
        tempdata.details_in_marathi = details_in_marathi;
      }

      if (imagelink) {
        tempdata.photo = imagelink;
      }

      const createdImage = new Martyrs(tempdata);

      const Data = await createdImage.save();

      res.status(201).json({
        success: true,
        message: "New Martyrs data Added successfully!",
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

const updateMartyrs = async (req, res, next) => {
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
        sr_no,
        name,
        name_in_marathi,
        groupId,
        birth_date,
        joining_date,
        martyrs_date,
        birth_place,
        birth_place_in_marathi,
        father_name,
        father_name_in_marathi,
        area,
        area_in_marathi,
        incident,
        incident_in_marathi,
        post,
        post_in_marathi,
        details,
        details_in_marathi,
      } = req.body;

      const tempGroup = await Martyrs.findById(Id);

      if (!tempGroup) {
        return res
          .status(400)
          .json({ success: false, message: "data not found!" });
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

      if (sr_no) {
        tempGroup.sr_no = sr_no;
      }

      if (name) {
        tempGroup.name = name;
      }
      if (name_in_marathi) {
        tempGroup.name_in_marathi = name_in_marathi;
      }

      if (groupId) {
        tempGroup.groupId = groupId;
      }

      if (birth_date) {
        tempGroup.birth_date = birth_date;
      }
      if (joining_date) {
        tempGroup.joining_date = joining_date;
      }
      if (martyrs_date) {
        tempGroup.martyrs_date = martyrs_date;
      }
      if (birth_place) {
        tempGroup.birth_place = birth_place;
      }
      if (birth_place_in_marathi) {
        tempGroup.birth_place_in_marathi = birth_place_in_marathi;
      }
      if (father_name) {
        tempGroup.father_name = father_name;
      }
      if (father_name_in_marathi) {
        tempGroup.father_name_in_marathi = father_name_in_marathi;
      }
      if (area) {
        tempGroup.area = area;
      }
      if (area_in_marathi) {
        tempGroup.area_in_marathi = area_in_marathi;
      }
      if (incident) {
        tempGroup.incident = incident;
      }
      if (incident_in_marathi) {
        tempGroup.incident_in_marathi = incident_in_marathi;
      }
      if (post) {
        tempGroup.post = post;
      }
      if (post_in_marathi) {
        tempGroup.post_in_marathi = post_in_marathi;
      }
      if (details) {
        tempGroup.details = details;
      }
      if (details_in_marathi) {
        tempGroup.details_in_marathi = details_in_marathi;
      }

      await tempGroup.save();

      res.status(201).json({
        success: true,
        message: "martyrs data updated successfully!",
        data: tempGroup,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getMartyrsData = async (req, res, next) => {
  let Data;

  try {
    Data = await Martyrs.find({}).sort({ sr_no: 1 }).populate({
      path: "groupId",
      select: "group_name group_name_in_marathi", // Only fetch the name and name_in_marathi fields from Group model
    });

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

const getMartyrsDatabyId = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const record = await Martyrs.findById(Id).populate({
      path: "groupId",
      select: "group_name group_name_in_marathi", // Only fetch the name and name_in_marathi fields from Group model
    });

    res.status(200).json({ record });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const deleteMartyrsData = async (req, res, next) => {
  try {
    const { Id } = req.query;
    // console.log(Id);

    // Find the record in MongoDB by its ID
    const record = await Martyrs.findById(Id);

    if (!record) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    // if (record.file_type === "pdf") {
    // Delete the corresponding PDF file from S3
    if (record.photo) {
      const s3DeleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: record.photo.substring(record.photo.lastIndexOf("/") + 1), // Extract the filename from the URL
      };

      const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
      await s3.send(deleteCommand);
    }

    // }

    // Delete the record from MongoDB
    await Martyrs.findByIdAndDelete(Id);

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

exports.addMartyrs = addMartyrs;

exports.updateMartyrs = updateMartyrs;

exports.getMartyrsData = getMartyrsData;

exports.getMartyrsDatabyId = getMartyrsDatabyId;

exports.deleteMartyrsData = deleteMartyrsData;
