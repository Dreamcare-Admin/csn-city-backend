const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const SeniorOfficer = require("../models/senior-officer");

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
const Officer = require("../models/Officer");

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

const addSeniorOfficer = async (req, res, next) => {
  let imagelink;
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
        designation,
        designation_in_marathi,
        phone,
        email,
        mobile,
      } = req.body;

      const sanitizedSrNo = DOMPurify.sanitize(sr_no);
      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
      const sanitizedDesignation = DOMPurify.sanitize(designation);
      const sanitizedDesignationInMarathi = DOMPurify.sanitize(
        designation_in_marathi
      );
      const sanitizedPhone = DOMPurify.sanitize(phone);
      const sanitizedEmail = DOMPurify.sanitize(email);
      const sanitizedMobile = DOMPurify.sanitize(mobile);

      if (
        (!sanitizedSrNo && sr_no) ||
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi) ||
        (!sanitizedDesignation && designation) ||
        (!sanitizedDesignationInMarathi && designation_in_marathi) ||
        (!sanitizedPhone && phone) ||
        (!sanitizedEmail && email) ||
        (!sanitizedMobile && mobile)
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

      if (imagelink) {
        tempdata.photo = imagelink;
      }

      if (phone) {
        tempdata.phone = phone;
      }
      if (email) {
        tempdata.email = email;
      }
      if (mobile) {
        tempdata.mobile = mobile;
      }

      const createdImage = new SeniorOfficer(tempdata);

      const Data = await createdImage.save();

      res.status(201).json({
        success: true,
        message: "New data Added successfully!",
        Data,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const updateSeniorOfficer = async (req, res, next) => {
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
        designation,
        designation_in_marathi,
        phone,
        email,
        mobile,
      } = req.body;

      const sanitizedSrNo = DOMPurify.sanitize(sr_no);
      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
      const sanitizedDesignation = DOMPurify.sanitize(designation);
      const sanitizedDesignationInMarathi = DOMPurify.sanitize(
        designation_in_marathi
      );
      const sanitizedPhone = DOMPurify.sanitize(phone);
      const sanitizedEmail = DOMPurify.sanitize(email);
      const sanitizedMobile = DOMPurify.sanitize(mobile);

      if (
        (!sanitizedSrNo && sr_no) ||
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi) ||
        (!sanitizedDesignation && designation) ||
        (!sanitizedDesignationInMarathi && designation_in_marathi) ||
        (!sanitizedPhone && phone) ||
        (!sanitizedEmail && email) ||
        (!sanitizedMobile && mobile)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      const tempGroup = await SeniorOfficer.findById(Id);

      if (!tempGroup) {
        return res
          .status(400)
          .json({ success: false, message: "officer not found!" });
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

      if (designation) {
        tempGroup.designation = designation;
      }
      if (designation_in_marathi) {
        tempGroup.designation_in_marathi = designation_in_marathi;
      }

      if (phone) {
        tempGroup.phone = phone;
      }
      if (email) {
        tempGroup.email = email;
      }
      if (mobile) {
        tempGroup.mobile = mobile;
      }

      await tempGroup.save();

      res.status(201).json({
        success: true,
        message: "officer data updated successfully!",
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getSeniorOfficerData = async (req, res, next) => {
  let Data;

  try {
    Data = await SeniorOfficer.find({}).sort({ sr_no: 1 });

    res.status(200).json({ Data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const deleteSeniorOfficer = async (req, res, next) => {
  try {
    const { Id } = req.query;
    // console.log(id);

    // Find the record in MongoDB by its ID
    const record = await SeniorOfficer.findById(Id);

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
    await SeniorOfficer.findByIdAndDelete(Id);

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

const getStationsWithOfficers = async (req, res, next) => {
  try {
    const PoliceStation = require("../models/police-station");
    
    const stations = await PoliceStation.find({});

    const results = await Promise.all(
      stations.map(async (station) => {
        // Match officer by name (admin or crime PI)
        let officer =
          await Officer.findOne({ psId: station._id }).populate({
            path: "psId",
            select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
          });

        return {
          station_name: station.name,
          station_name_in_marathi: station.name_in_marathi,
          address: station.address,
          address_in_marathi: station.address_in_marathi,
          contact_no: station.contact_no,
          map_link: station.maplink,
          latitude: station.latitude,
          longitude: station.longitude,
          officer_name: officer?.name ? officer.name.split(' - ')[0] : null,
          officer_name_in_marathi: officer?.name_in_marathi ? officer.name_in_marathi.split(' - ')[0] : null,
        };
      })
    );

    res.status(200).json({ 
      success: true, 
      data: results 
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error" });
  }
};

exports.addSeniorOfficer = addSeniorOfficer;

exports.updateSeniorOfficer = updateSeniorOfficer;

exports.getSeniorOfficerData = getSeniorOfficerData;

exports.deleteSeniorOfficer = deleteSeniorOfficer;

exports.getStationsWithOfficers = getStationsWithOfficers;
