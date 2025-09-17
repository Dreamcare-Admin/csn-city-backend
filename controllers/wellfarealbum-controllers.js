const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Contact = require("../models/contact");
const WellfareAlbum = require("../models/wellfarealbum");
const Image = require("../models/image");

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

const createAlbum = async (req, res, next) => {
  const { title, titleInMarathi } = req.body;

  const sanitizedTitle = DOMPurify.sanitize(title);
  const sanitizedTitleInMarathi = DOMPurify.sanitize(titleInMarathi);

  if (
    (!sanitizedTitle && title) ||
    (!sanitizedTitleInMarathi && titleInMarathi)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  try {
    const tempdata = {
      title,
      titleInMarathi,
    };

    const album = new WellfareAlbum(tempdata);

    await album.save();

    res.status(201).json({ success: true, album: album });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const addImage = async (req, res, next) => {
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

      const { description, descriptionInMarathi, albumId } = req.body;

      const sanitizedDescription = DOMPurify.sanitize(description);
      const sanitizedDescriptionInMarathi =
        DOMPurify.sanitize(descriptionInMarathi);
      const sanitizedAlbumId = DOMPurify.sanitize(albumId);

      if (
        (!sanitizedDescription && description) ||
        (!sanitizedDescriptionInMarathi && descriptionInMarathi) ||
        (!sanitizedAlbumId && albumId)
      ) {
        return res
          .status(500)
          .json({ success: false, message: "invalid data" });
      }

      // Now you can store the S3 file URL in your database
      const imagelink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;

      const tempdata = {
        imagelink,
        album: albumId,
      };

      if (description) {
        tempdata.description = description;
      } else {
        tempdata.description = "";
      }
      if (descriptionInMarathi) {
        tempdata.descriptionInMarathi = descriptionInMarathi;
      } else {
        tempdata.descriptionInMarathi = "";
      }

      const createdImage = new Image(tempdata);

      const tempimage = await createdImage.save();

      res.status(201).json({
        success: true,
        message: "New image created successfully!",
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

const imagesByAlbum = async (req, res, next) => {
  const { albumId } = req.query;
  try {
    const images = await Image.find(
      { album: albumId },
      "_id imagelink description descriptionInMarathi"
    );

    const albumName = await WellfareAlbum.find(
      { _id: albumId },
      "title titleInMarathi"
    );

    const title = albumName[0].title;
    const titleInMarathi = albumName[0].titleInMarathi;

    res.status(200).json({
      success: true,
      images: images,
      title: title,
      titleInMarathi: titleInMarathi,
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

const allAlbumsAdmin = async (req, res, next) => {
  try {
    const albums = await WellfareAlbum.find({}).sort({ createdAt: -1 });

    res.status(200).json(albums);
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

const allAlbumsAdminbyGroup = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const albums = await WellfareAlbum.find({ groupId: Id })
      .sort({ createdAt: -1 })
      .populate({
        path: "groupId",
        select: "group_name group_name_in_marathi", // Only fetch the name and name_in_marathi fields from Group model
      });

    res.status(200).json(albums);
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

const deleteImageById = async (req, res, next) => {
  try {
    const { id } = req.query;
    // console.log(id);

    // Find the record in MongoDB by its ID
    const image = await Image.findById(id);

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
    await Image.findByIdAndDelete(id);

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

const updateAlbum = async (req, res, next) => {
  const { albumId } = req.query;
  const { title, titleInMarathi } = req.body;

  const sanitizedTitle = DOMPurify.sanitize(title);
  const sanitizedTitleInMarathi = DOMPurify.sanitize(titleInMarathi);

  if (
    (!sanitizedTitle && title) ||
    (!sanitizedTitleInMarathi && titleInMarathi)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  try {
    let album = await WellfareAlbum.findById(albumId);

    if (!album) {
      const error = new HttpError("Album not found", 404);
      return next(error);
    }

    album.title = title;
    album.titleInMarathi = titleInMarathi;

    await album.save();

    res.status(200).json({ success: true, album: album });
  } catch (err) {
    console.error(err);
    const error = new HttpError(
      "Something went wrong, please try again later.",
      500
    );
    return next(error);
  }
};

const updateImage = async (req, res, next) => {
  const { imageId } = req.query;
  const { description, descriptionInMarathi } = req.body;

  const sanitizedDescription = DOMPurify.sanitize(description);
  const sanitizedDescriptionInMarathi =
    DOMPurify.sanitize(descriptionInMarathi);

  if (
    (!sanitizedDescription && description) ||
    (!sanitizedDescriptionInMarathi && descriptionInMarathi)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  try {
    let imagetemp = await Image.findById(imageId);

    if (!imagetemp) {
      const error = new HttpError("image not found", 404);
      return next(error);
    }
    if (description) {
      imagetemp.description = description;
    }

    if (descriptionInMarathi) {
      imagetemp.descriptionInMarathi = descriptionInMarathi;
    }

    await imagetemp.save();

    res.status(200).json({ success: true, image: imagetemp });
  } catch (err) {
    console.error(err);
    const error = new HttpError(
      "Something went wrong, please try again later.",
      500
    );
    return next(error);
  }
};

const bulkImageUpload = async (req, res, next) => {
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
    }).array("images", 10); // Use 'array' instead of 'single' to handle multiple files with a limit of 10 files (you can adjust the limit)

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

        const { albumId } = req.body;

        // Store the S3 file URL in your database for each uploaded image
        const imagelink = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;

        const createdImage = new Image({
          description: "",
          descriptionInMarathi: "",
          imagelink,
          album: albumId,
        });

        const tempimage = await createdImage.save();
        imageLinks.push(tempimage.imagelink);
      }

      res.status(201).json({
        success: true,
        message: "Images uploaded successfully!",
        imageLinks,
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

exports.createAlbum = createAlbum;

exports.addImage = addImage;

exports.imagesByAlbum = imagesByAlbum;

exports.allAlbumsAdmin = allAlbumsAdmin;

exports.deleteImageById = deleteImageById;

exports.updateAlbum = updateAlbum;

exports.updateImage = updateImage;

exports.bulkImageUpload = bulkImageUpload;

exports.allAlbumsAdminbyGroup = allAlbumsAdminbyGroup;
