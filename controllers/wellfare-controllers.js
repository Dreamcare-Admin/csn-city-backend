const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const Wellfare = require("../models/wellfare");

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

const addWellfare = async (req, res, next) => {
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
              "Invalid file format. Only PNG, JPG, webp and JPEG files are allowed."
            ),
            false
          );
        }
      },
    }).array("images", 5); // Use 'array' instead of 'single' to handle multiple files with a limit of 10 files (you can adjust the limit)

    upload(req, res, async function (err) {
      if (err) {
        // Handle parsing error here
        const error = new HttpError("Error parsing files", 500);
        res
          .status(500)
          .json({ success: false, message: "Error parsing files" });
        return next(error);
      }

      // req.files should now contain an array of uploaded files
      const imageFiles = req.files;

      if (!imageFiles || imageFiles.length === 0) {
        const error = new HttpError("No image files were uploaded", 400);
        return next(error);
      }

      const imageLinks = [];

      // Iterate through the uploaded files and upload each to S3
      for (const imageFile of imageFiles) {
        const filename = `${uuidv4()}${path.extname(imageFile.originalname)}`;
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
          // Handle the S3 upload error here for each file
          throw new Error("S3 file upload failed");
        }

        // Store the S3 file URL in your database for each uploaded image
        const imagelink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;

        imageLinks.push(imagelink);
      }

      const { title, title_in_marathi, date, about, about_in_marathi, tag } =
        req.body;

      const sanitizedTitle = DOMPurify.sanitize(title);
      const sanitizedTitleInMarathi = DOMPurify.sanitize(title_in_marathi);
      const sanitizedDate = DOMPurify.sanitize(date);
      const sanitizedAbout = DOMPurify.sanitize(about);
      const sanitizedAboutInMarathi = DOMPurify.sanitize(about_in_marathi);
      const sanitizedTag = DOMPurify.sanitize(tag);

      if (
        (!sanitizedTitle && title) ||
        (!sanitizedTitleInMarathi && title_in_marathi) ||
        (!sanitizedDate && date) ||
        (!sanitizedAbout && about) ||
        (!sanitizedAboutInMarathi && about_in_marathi) ||
        (!sanitizedTag && tag)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      // Now you can store the S3 file URL in your database

      const tempdata = {
        title,
        title_in_marathi,
        photo: imageLinks,
        tag: tag,
      };

      if (date) {
        tempdata.date = date;
      }

      if (about) {
        tempdata.about = about;
      }
      if (about_in_marathi) {
        tempdata.about_in_marathi = about_in_marathi;
      }

      const createdwellfare = new Wellfare(tempdata);

      const Data = await createdwellfare.save();

      res.status(201).json({
        success: true,
        message: "Images uploaded successfully!",
        Data,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// const addWellfare = async (req, res, next) => {
//   let imagelink;
//   try {
//     const storage = multer.memoryStorage();
//     const upload = multer({
//       storage,
//       fileFilter: function (req, file, cb) {
//         // Accept only image files with extensions .png, .jpg, and .jpeg
//         const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
//         const fileExtension = path.extname(file.originalname).toLowerCase();
//         if (allowedExtensions.includes(fileExtension)) {
//           cb(null, true);
//         } else {
//           cb(
//             new Error(
//               "Invalid file format. Only PNG, JPG, and JPEG files are allowed."
//             ),
//             false
//           );
//         }
//       },
//     }).single("image");

//     upload(req, res, async function (err) {
//       if (err) {
//         // Handle parsing error here
//         // console.error(err);
//         const error = new HttpError("Error parsing file", 500);
//         res.status(500).json({ success: false, message: "Error parsing file" });
//         return next(error);
//       }

//       // req.file should now contain the 'image' file
//       const imageFile = req.file;

//       if (imageFile) {
//         // Generate a unique filename for the uploaded image (you can adjust this as needed)
//         const filename = `${uuidv4()}${path.extname(imageFile.originalname)}`;

//         // Upload the image file to S3 and get the unique file link.
//         const uploadParams = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: filename,
//           Body: imageFile.buffer,
//           ContentType: imageFile.mimetype,
//         };

//         const uploadCommand = new PutObjectCommand(uploadParams);
//         const uploadResult = await s3.send(uploadCommand);

//         if (
//           !uploadResult.$metadata.httpStatusCode ||
//           uploadResult.$metadata.httpStatusCode !== 200
//         ) {
//           // Handle the S3 upload error here
//           throw new Error("S3 file upload failed");
//         }

//         imagelink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
//       }

//       const { title, title_in_marathi, date, about, about_in_marathi } =
//         req.body;

//       // Now you can store the S3 file URL in your database

//       const tempdata = {
//         title,
//         title_in_marathi,
//         // photo: imagelink,
//       };

//       if (imagelink) {
//         tempdata.photo = imagelink;
//       }

//       if (date) {
//         tempdata.date = date;
//       }

//       if (about) {
//         tempdata.about = about;
//       }
//       if (about_in_marathi) {
//         tempdata.about_in_marathi = about_in_marathi;
//       }

//       const createdImage = new Wellfare(tempdata);

//       const Data = await createdImage.save();

//       res.status(201).json({
//         success: true,
//         message: "New data Added successfully!",
//         Data,
//       });
//     });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Something went wrong" });
//   }
// };

// const updateWellfare = async (req, res, next) => {
//   const { Id } = req.query;
//   let imageLink1;
//   try {
//     const storage = multer.memoryStorage();
//     const upload = multer({
//       storage,
//       fileFilter: function (req, file, cb) {
//         const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
//         const fileExtension = path.extname(file.originalname).toLowerCase();
//         if (allowedExtensions.includes(fileExtension)) {
//           cb(null, true);
//         } else {
//           cb(
//             new Error(
//               "Invalid file format. Only PNG, JPG, and JPEG files are allowed."
//             ),
//             false
//           );
//         }
//       },
//     }).fields([{ name: "image", maxCount: 1 }]);

//     upload(req, res, async function (err) {
//       if (err) {
//         const error = new HttpError("Error parsing file", 500);
//         res.status(500).json({ success: false, message: "Error parsing file" });
//         return next(error);
//       }

//       const imageFile1 = req.files.image ? req.files.image[0] : null;

//       // Function to upload a file to S3
//       const uploadToS3 = async (file) => {
//         const filename = `${uuidv4()}${path.extname(file.originalname)}`;
//         const uploadParams = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: filename,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//         };
//         const uploadCommand = new PutObjectCommand(uploadParams);
//         await s3.send(uploadCommand);
//         return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
//       };

//       if (imageFile1) {
//         imageLink1 = await uploadToS3(imageFile1);
//       }

//       const { title, title_in_marathi, date, about, about_in_marathi } =
//         req.body;

//       const tempGroup = await Wellfare.findById(Id);

//       if (!tempGroup) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Wellfare not found!" });
//       }

//       if (tempGroup.photo && imageFile1) {
//         const s3DeleteParams = {
//           Bucket: process.env.AWS_S3_BUCKET,
//           Key: tempGroup.photo.substring(tempGroup.photo.lastIndexOf("/") + 1), // Extract the filename from the URL
//         };

//         const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
//         await s3.send(deleteCommand);
//       }

//       if (imageFile1) {
//         tempGroup.photo = imageLink1;
//       }

//       tempGroup.title = title;
//       tempGroup.title_in_marathi = title_in_marathi;

//       if (date) {
//         tempGroup.date = date;
//       }

//       if (about) {
//         tempGroup.about = about;
//       }
//       if (about_in_marathi) {
//         tempGroup.about_in_marathi = about_in_marathi;
//       }

//       await tempGroup.save();

//       res.status(201).json({
//         success: true,
//         message: "Wellfare data updated successfully!",
//       });
//     });
//   } catch (err) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Something went wrong" });
//   }
// };

const updateWellfare = async (req, res, next) => {
  const { Id } = req.query;
  let imageLinks = []; // Array to store uploaded image links
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
    }).array("images", 5); // Change from .fields to .array for handling multiple images, with a maximum of 5 images

    upload(req, res, async function (err) {
      if (err) {
        const error = new HttpError("Error parsing file", 500);
        res.status(500).json({ success: false, message: "Error parsing file" });
        return next(error);
      }

      const imageFiles = req.files; // Array of uploaded image files

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

      // Upload each image to S3 and store the links
      if (imageFiles && imageFiles.length > 0) {
        for (const imageFile of imageFiles) {
          const imageLink = await uploadToS3(imageFile);
          imageLinks.push(imageLink);
        }
      }

      const { title, title_in_marathi, date, about, about_in_marathi } =
        req.body;

      const sanitizedTitle = DOMPurify.sanitize(title);
      const sanitizedTitleInMarathi = DOMPurify.sanitize(title_in_marathi);
      const sanitizedDate = DOMPurify.sanitize(date);
      const sanitizedAbout = DOMPurify.sanitize(about);
      const sanitizedAboutInMarathi = DOMPurify.sanitize(about_in_marathi);

      if (
        (!sanitizedTitle && title) ||
        (!sanitizedTitleInMarathi && title_in_marathi) ||
        (!sanitizedDate && date) ||
        (!sanitizedAbout && about) ||
        (!sanitizedAboutInMarathi && about_in_marathi)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      const tempGroup = await Wellfare.findById(Id);

      if (!tempGroup) {
        return res
          .status(400)
          .json({ success: false, message: "Wellfare not found!" });
      }

      // Delete multiple existing photos if any
      if (
        imageLinks.length > 0 &&
        tempGroup.photo &&
        tempGroup.photo.length > 0
      ) {
        const deletePromises = tempGroup.photo.map(async (photo) => {
          const s3DeleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: photo.substring(photo.lastIndexOf("/") + 1), // Extract the filename from the URL
          };

          const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
          await s3.send(deleteCommand);
        });

        await Promise.all(deletePromises);
      }

      // Update photo field with the first image link (assuming there's at least one image uploaded)
      if (imageLinks.length > 0) {
        tempGroup.photo = imageLinks;
      }

      tempGroup.title = title;
      tempGroup.title_in_marathi = title_in_marathi;

      if (date) {
        tempGroup.date = date;
      }

      if (about) {
        tempGroup.about = about;
      }
      if (about_in_marathi) {
        tempGroup.about_in_marathi = about_in_marathi;
      }

      await tempGroup.save();

      res.status(201).json({
        success: true,
        message: "Wellfare data updated successfully!",
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getWellfareDataAll = async (req, res, next) => {
  let Data;
  const { tag } = req.query;
  try {
    Data = await Wellfare.find({ tag: tag }).sort({ createdAt: -1 });

    res.status(200).json({ Data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getInitiativeDataHome = async (req, res, next) => {
  let Data;
  try {
    Data = await Wellfare.find({ tag: "initiative" })
      .sort({ createdAt: -1 })
      .limit(4);

    res.status(200).json({ Data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getWellfareDatabyId = async (req, res, next) => {
  let Data;
  const { Id } = req.query;

  try {
    Data = await Wellfare.findById(Id);

    res.status(200).json({ Data });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const deleteWellfareData = async (req, res, next) => {
  try {
    const { Id } = req.query;

    const record = await Wellfare.findById(Id);

    if (!record) {
      return res
        .status(400)
        .json({ success: false, message: "record not found" });
    }

    if (record.photo) {
      const deletePromises = record.photo.map(async (photoUrl) => {
        const s3DeleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: photoUrl.substring(photoUrl.lastIndexOf("/") + 1), // Extract the filename from the URL
        };
        const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
        await s3.send(deleteCommand);
      });
      await Promise.all(deletePromises);
    }
    // Delete the record from MongoDB
    await Wellfare.findByIdAndDelete(Id);

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

exports.addWellfare = addWellfare;

exports.updateWellfare = updateWellfare;

exports.getWellfareDataAll = getWellfareDataAll;

exports.getWellfareDatabyId = getWellfareDatabyId;

exports.deleteWellfareData = deleteWellfareData;

exports.getInitiativeDataHome = getInitiativeDataHome;
