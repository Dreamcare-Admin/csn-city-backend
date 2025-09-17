const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Officer = require("../models/Officer");
const PoliceStation = require("../models/police-station");

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
        psId,
        name,
        name_in_marathi,
        date_of_joining,
        post,
        post_in_marathi,
        contact_no,
        email,
        mobile,
        sr_no,
      } = req.body;

      const sanitizedPsId = DOMPurify.sanitize(psId);
      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
      const sanitizedDateOfJoining = DOMPurify.sanitize(date_of_joining);
      const sanitizedPost = DOMPurify.sanitize(post);
      const sanitizedPostInMarathi = DOMPurify.sanitize(post_in_marathi);
      const sanitizedContactNo = DOMPurify.sanitize(contact_no);
      const sanitizedEmail = DOMPurify.sanitize(email);
      const sanitizedMobile = DOMPurify.sanitize(mobile);
      const sanitizedSrNo = DOMPurify.sanitize(sr_no);

      if (
        (!sanitizedPsId && psId) ||
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi) ||
        (!sanitizedDateOfJoining && date_of_joining) ||
        (!sanitizedPost && post) ||
        (!sanitizedPostInMarathi && post_in_marathi) ||
        (!sanitizedContactNo && contact_no) ||
        (!sanitizedEmail && email) ||
        (!sanitizedMobile && mobile) ||
        (!sanitizedSrNo && sr_no)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      const tempGroup = {
        name,
        name_in_marathi,
        // psId,
      };
      if (psId) {
        tempGroup.psId = psId;
      }

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
      if (mobile) {
        tempGroup.mobile = mobile;
      }

      if (sr_no) {
        tempGroup.sr_no = sr_no;
      }

      const createdGroup = new Officer(tempGroup);

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
        psId,
        name,
        name_in_marathi,
        date_of_joining,
        post,
        post_in_marathi,
        contact_no,
        email,
        mobile,
        sr_no,
      } = req.body;

      const sanitizedPsId = DOMPurify.sanitize(psId);
      const sanitizedName = DOMPurify.sanitize(name);
      const sanitizedNameInMarathi = DOMPurify.sanitize(name_in_marathi);
      const sanitizedDateOfJoining = DOMPurify.sanitize(date_of_joining);
      const sanitizedPost = DOMPurify.sanitize(post);
      const sanitizedPostInMarathi = DOMPurify.sanitize(post_in_marathi);
      const sanitizedContactNo = DOMPurify.sanitize(contact_no);
      const sanitizedEmail = DOMPurify.sanitize(email);
      const sanitizedMobile = DOMPurify.sanitize(mobile);
      const sanitizedSrNo = DOMPurify.sanitize(sr_no);

      if (
        (!sanitizedPsId && psId) ||
        (!sanitizedName && name) ||
        (!sanitizedNameInMarathi && name_in_marathi) ||
        (!sanitizedDateOfJoining && date_of_joining) ||
        (!sanitizedPost && post) ||
        (!sanitizedPostInMarathi && post_in_marathi) ||
        (!sanitizedContactNo && contact_no) ||
        (!sanitizedEmail && email) ||
        (!sanitizedMobile && mobile) ||
        (!sanitizedSrNo && sr_no)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      const tempGroup = await Officer.findById(Id);

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
      if (psId) {
        tempGroup.psId = psId;
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
      if (mobile) {
        tempGroup.mobile = mobile;
      }

      if (sr_no) {
        tempGroup.sr_no = sr_no;
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
    Officers = await Officer.find({}).populate({
      path: "psId",
      select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
    });
    res.status(200).json({ Officers });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getOfficersByUser = async (req, res, next) => {
  let Officers;
  const { Id } = req.query;

  try {
    Officers = await Officer.find({ psId: Id }).populate({
      path: "psId",
      select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
    });
    res.status(200).json({ Officers });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const deleteOfficerById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const tempGroup = await Officer.findById(Id);

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

    await Officer.findByIdAndDelete(Id);

    res.json({ success: true, message: "Officer data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getOfficerByZone = async (req, res, next) => {
  try {
    const officersByZone = await Officer.aggregate([
      {
        $lookup: {
          from: "policestations",
          localField: "psId",
          foreignField: "_id",
          as: "policeStation",
        },
      },
      {
        $unwind: "$policeStation",
      },
      {
        $lookup: {
          from: "zones",
          localField: "policeStation.zone",
          foreignField: "_id",
          as: "zone",
        },
      },
      {
        $unwind: "$zone",
      },
      {
        $group: {
          _id: "$zone._id",
          zoneName: { $first: "$zone.name" },
          zoneNameInMarathi: { $first: "$zone.name_in_marathi" },
          officers: {
            $push: {
              _id: "$_id",
              name: "$name",
              nameInMarathi: "$name_in_marathi",
              post: "$post",
              postInMarathi: "$post_in_marathi",
              contactNo: "$contact_no",
              email: "$email",
              officer_photo: "$officer_photo",
              policeStation: {
                _id: "$policeStation._id",
                name: "$policeStation.name",
                nameInMarathi: "$policeStation.name_in_marathi",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          zoneName: 1,
          zoneNameInMarathi: 1,
          officerCount: { $size: "$officers" },
          officers: 1,
        },
      },
      {
        $sort: { zoneName: 1 },
      },
    ]);

    res.json({ Officers: officersByZone });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// const getOfficerByDivision = async (req, res, next) => {
//   try {
//     const officersByDivision = await Officer.aggregate([
//       // Join with PoliceStation to get division
//       {
//         $lookup: {
//           from: "policestations",
//           localField: "psId",
//           foreignField: "_id",
//           as: "policeStation",
//         },
//       },
//       { $unwind: "$policeStation" },

//       // Join with Division to get division details
//       {
//         $lookup: {
//           from: "divisions",
//           localField: "policeStation.division",
//           foreignField: "_id",
//           as: "division",
//         },
//       },
//       { $unwind: "$division" },

//       // Group by division
//       {
//         $group: {
//           _id: "$division._id",
//           divisionName: { $first: "$division.name" },
//           divisionNameInMarathi: { $first: "$division.name_in_marathi" },
//           divisionSr_no: { $first: "$division.sr_no" },
//           officers: {
//             $push: {
//               _id: "$_id",
//               name: "$name",
//               name_in_marathi: "$name_in_marathi",
//               post: "$post",
//               post_in_marathi: "$post_in_marathi",
//               contact_no: "$contact_no",
//               email: "$email",
//               officer_photo: "$officer_photo",
//               mobile: "$mobile",
//               sr_no: "$sr_no",
//               policeStation: {
//                 _id: "$policeStation._id",
//                 name: "$policeStation.name",
//                 nameInMarathi: "$policeStation.name_in_marathi",
//               },
//             },
//           },
//         },
//       },

//       // Sort officers within each division by sr_no
//       {
//         $addFields: {
//           officers: {
//             $sortArray: {
//               input: "$officers",
//               sortBy: { sr_no: 1 },
//             },
//           },
//         },
//       },

//       // Sort divisions by name
//       { $sort: { divisionSr_no: 1 } },
//     ]);

//     res.json({
//       Officers: officersByDivision,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const getOfficerByDivision = async (req, res, next) => {
  try {
    const result = await Officer.aggregate([
      // Join with PoliceStation to get division
      {
        $lookup: {
          from: "policestations",
          localField: "psId",
          foreignField: "_id",
          as: "policeStation",
        },
      },
      { $unwind: "$policeStation" },

      // Join with Division to get division details
      {
        $lookup: {
          from: "divisions",
          localField: "policeStation.division",
          foreignField: "_id",
          as: "division",
        },
      },
      { $unwind: { path: "$division", preserveNullAndEmptyArrays: true } },

      // Separate officers with empty division
      {
        $facet: {
          officersWithDivision: [
            { $match: { "division._id": { $exists: true, $ne: null } } },
            // Group by division (same as before)
            {
              $group: {
                _id: "$division._id",
                divisionName: { $first: "$division.name" },
                divisionNameInMarathi: { $first: "$division.name_in_marathi" },
                divisionSr_no: { $first: "$division.sr_no" },
                officers: {
                  $push: {
                    _id: "$_id",
                    name: "$name",
                    name_in_marathi: "$name_in_marathi",
                    post: "$post",
                    post_in_marathi: "$post_in_marathi",
                    contact_no: "$contact_no",
                    email: "$email",
                    officer_photo: "$officer_photo",
                    mobile: "$mobile",
                    sr_no: "$sr_no",
                    policeStation: {
                      _id: "$policeStation._id",
                      name: "$policeStation.name",
                      nameInMarathi: "$policeStation.name_in_marathi",
                    },
                  },
                },
              },
            },
            // Sort officers within each division by sr_no
            {
              $addFields: {
                officers: {
                  $sortArray: {
                    input: "$officers",
                    sortBy: { sr_no: 1 },
                  },
                },
              },
            },
            // Sort divisions by sr_no
            { $sort: { divisionSr_no: 1 } },
          ],
          officersWithoutDivision: [
            {
              $match: {
                $or: [
                  { "division._id": null },
                  { "division._id": { $exists: false } },
                ],
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                name_in_marathi: 1,
                post: 1,
                post_in_marathi: 1,
                contact_no: 1,
                email: 1,
                officer_photo: 1,
                mobile: 1,
                sr_no: 1,
                policeStation: {
                  _id: "$policeStation._id",
                  name: "$policeStation.name",
                  nameInMarathi: "$policeStation.name_in_marathi",
                },
              },
            },
            { $sort: { sr_no: 1 } },
          ],
        },
      },
    ]);

    res.json({
      OfficersByDivision: result[0].officersWithDivision,
      OfficersWithoutDivision: result[0].officersWithoutDivision,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createOfficer = createOfficer;

exports.updateOfficer = updateOfficer;

exports.getOfficersAdmin = getOfficersAdmin;

exports.getOfficersByUser = getOfficersByUser;

exports.deleteOfficerById = deleteOfficerById;

exports.getOfficerByZone = getOfficerByZone;

exports.getOfficerByDivision = getOfficerByDivision;
