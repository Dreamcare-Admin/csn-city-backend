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

const uploadPdfToS3 = async (pdfFile) => {
  try {
    if (!pdfFile) {
      throw new Error("PDF file is missing");
    }

    // Generate a unique filename for the uploaded file
    const filename = `${uuidv4()}.pdf`;

    // Upload the PDF file to S3 and get the unique file link
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filename,
      Body: pdfFile.buffer,
      ContentDisposition: "inline",
      ContentType: "application/pdf",
    };

    const uploadCommand = new PutObjectCommand(uploadParams);
    const uploadResult = await s3.send(uploadCommand);

    if (
      !uploadResult.$metadata.httpStatusCode ||
      uploadResult.$metadata.httpStatusCode !== 200
    ) {
      throw new Error("S3 file upload failed");
    }

    // Construct the S3 URL
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;

    return fileUrl;
  } catch (error) {
    throw new Error(`Error uploading PDF to S3: ${error.message}`);
  }
};

const uploadImageToS3 = async (imageFile) => {
  try {
    if (!imageFile) {
      throw new Error("Image file is missing");
    }

    // Generate a unique filename for the uploaded image
    const filename = `${uuidv4()}${path.extname(imageFile.originalname)}`;

    // Upload the image file to S3 and get the unique file link
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
      throw new Error("S3 file upload failed");
    }

    // Construct the S3 URL
    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;

    return fileUrl;
  } catch (error) {
    throw new Error(`Error uploading image to S3: ${error.message}`);
  }
};

const deleteObjectFromS3 = async (objectUrl) => {
  try {
    // Extract the filename from the URL
    const filename = objectUrl.substring(objectUrl.lastIndexOf("/") + 1);

    const s3DeleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: filename,
    };

    const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
    await s3.send(deleteCommand);
  } catch (error) {
    throw new Error(`Error deleting object from S3:`);
  }
};

exports.uploadPdfToS3 = uploadPdfToS3;

exports.uploadImageToS3 = uploadImageToS3;

exports.deleteObjectFromS3 = deleteObjectFromS3;
