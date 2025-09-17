const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Contact = require("../models/contact");
const Album = require("../models/album");
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
  const {
    title,
    titleInMarathi,
    description,
    descriptionInMarathi,
    link,
    tag,
  } = req.body;

  const sanitizedTitle = DOMPurify.sanitize(title);
  const sanitizedTitleInMarathi = DOMPurify.sanitize(titleInMarathi);
  const sanitizedDescription = DOMPurify.sanitize(description);
  const sanitizedDescriptionInMarathi =
    DOMPurify.sanitize(descriptionInMarathi);
  const sanitizedLink = DOMPurify.sanitize(link);
  const sanitizedTag = DOMPurify.sanitize(tag);

  if (
    (!sanitizedTitle && title) ||
    (!sanitizedTitleInMarathi && titleInMarathi) ||
    (!sanitizedDescription && description) ||
    (!sanitizedDescriptionInMarathi && descriptionInMarathi) ||
    (!sanitizedLink && link) ||
    (!sanitizedTag && tag)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  try {
    const albumtemp = {
      title,
      titleInMarathi,
      tag,
    };

    if (description) {
      albumtemp.description = description;
    }

    if (descriptionInMarathi) {
      albumtemp.descriptionInMarathi = descriptionInMarathi;
    }
    if (link) {
      albumtemp.link = link;
    }
    const album = new Album(albumtemp);

    await album.save();

    res.status(201).json({ success: true, album: album });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const addImage = async (req, res, next) => {
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

      const createdImage = new Image({
        description,
        descriptionInMarathi,
        imagelink,
        album: albumId,
      });

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

    const albumName = await Album.find(
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
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const allAlbumsAdmin = async (req, res, next) => {
  const { tag } = req.query;
  try {
    const albums = await Album.find({ tag: tag }).sort({ createdAt: -1 });

    res.status(200).json(albums);
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
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
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getgallery = async (req, res, next) => {
  try {
    const { tag } = req.query; // Assuming the tag is passed in the query string

    // Define the aggregation pipeline
    const pipeline = [];

    // Match albums by tag
    if (tag) {
      pipeline.push({
        $match: { tag }, // Filter albums by tag
      });
    }

    // Add the remaining pipeline stages
    pipeline.push(
      {
        $lookup: {
          from: "images", // Replace with the actual name of your Image collection
          localField: "_id",
          foreignField: "album",
          as: "images",
        },
      },
      {
        $match: {
          "images.0": { $exists: true }, // Filter albums with at least one image
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          titleInMarathi: 1,
          createdAt: 1,
          image: {
            imagelink: { $arrayElemAt: ["$images.imagelink", 0] },
            imageid: { $arrayElemAt: ["$images._id", 0] },
          },
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order (latest first)
      }
    );

    // Execute the aggregation pipeline
    const albumsWithOneImage = await Album.aggregate(pipeline);

    res.status(200).json(albumsWithOneImage);
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const updateAlbum = async (req, res, next) => {
  const { albumId } = req.query;
  const { title, titleInMarathi, description, descriptionInMarathi, link } =
    req.body;

  const sanitizedTitle = DOMPurify.sanitize(title);
  const sanitizedTitleInMarathi = DOMPurify.sanitize(titleInMarathi);
  const sanitizedDescription = DOMPurify.sanitize(description);
  const sanitizedDescriptionInMarathi =
    DOMPurify.sanitize(descriptionInMarathi);
  const sanitizedLink = DOMPurify.sanitize(link);

  if (
    (!sanitizedTitle && title) ||
    (!sanitizedTitleInMarathi && titleInMarathi) ||
    (!sanitizedDescription && description) ||
    (!sanitizedDescriptionInMarathi && descriptionInMarathi) ||
    (!sanitizedLink && link)
  ) {
    return res.status(500).json({ success: false, message: "invalid data" });
  }

  try {
    let album = await Album.findById(albumId);

    if (!album) {
      const error = new HttpError("Album not found", 404);
      return next(error);
    }

    album.title = title;
    album.titleInMarathi = titleInMarathi;
    if (description) {
      album.description = description;
    }
    if (descriptionInMarathi) {
      album.descriptionInMarathi = descriptionInMarathi;
    }

    if (link) {
      album.link = link;
    }

    await album.save();

    res.status(200).json({ success: true, album: album });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
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

    imagetemp.description = description;
    imagetemp.descriptionInMarathi = descriptionInMarathi;

    await imagetemp.save();

    res.status(200).json({ success: true, image: imagetemp });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const bulkImageUpload = async (req, res, next) => {
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
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteAllAlbumImagesById = async (req, res, next) => {
  try {
    const { Id } = req.query;

    const Albumtemp = await Album.findById(Id);

    if (!Albumtemp) {
      const error = new HttpError("Record not found", 404);
      res.status(400).json({ success: false, message: "Album Not found!" });
      return next(error);
    }

    const Images = await Image.find({ album: Id });

    if (Images) {
      for (let index = 0; index < Images.length; index++) {
        const element = Images[index];
        const s3DeleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: element.imagelink.substring(
            element.imagelink.lastIndexOf("/") + 1
          ), // Extract the filename from the URL
        };

        const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
        await s3.send(deleteCommand);

        // Delete the record from MongoDB
        await Image.findByIdAndDelete(element._id);
      }
    }

    await Album.findByIdAndDelete(Id);

    res.json({ success: true, message: "Album deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getHomepageGallery = async (req, res, next) => {
  try {
    // Aggregation pipeline to get the latest 5 albums with tag 'gallery' and 2 images from each
    const pipeline = [
      // Match albums with tag 'gallery'
      { $match: { tag: "gallery" } },
      // Sort albums by creation date in descending order
      { $sort: { createdAt: -1 } },
      // Limit to the latest 5 albums
      { $limit: 5 },
      // Lookup images for each album
      {
        $lookup: {
          from: "images", // The collection to join
          localField: "_id", // Field from the Album collection
          foreignField: "album", // Field from the Image collection
          as: "images",
        },
      },
      // Add a projection to limit the number of images to 2 per album
      {
        $project: {
          _id: 1,
          title: 1,
          titleInMarathi: 1,
          tag: 1,
          images: { $slice: ["$images", 2] },
        },
      },
      // Unwind the images array to flatten it
      { $unwind: "$images" },
      // Replace root to output each image directly
      { $replaceRoot: { newRoot: "$images" } },
    ];

    const images = await Album.aggregate(pipeline).exec();

    res.json({ success: true, images });
  } catch (error) {
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

exports.createAlbum = createAlbum;

exports.addImage = addImage;

exports.imagesByAlbum = imagesByAlbum;

exports.allAlbumsAdmin = allAlbumsAdmin;

exports.deleteImageById = deleteImageById;

exports.getgallery = getgallery;

exports.updateAlbum = updateAlbum;

exports.updateImage = updateImage;

exports.bulkImageUpload = bulkImageUpload;

exports.deleteAllAlbumImagesById = deleteAllAlbumImagesById;

exports.getHomepageGallery = getHomepageGallery;
