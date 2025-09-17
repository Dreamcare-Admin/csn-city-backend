const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const albumControllers = require("../controllers/album-controllers");

const router = express.Router();

router.post("/add-album", verifyTokenMiddleware, albumControllers.createAlbum);

router.post("/add-image", verifyTokenMiddleware, albumControllers.addImage);

// router.get("/get-albums", albumControllers.getAllAlbumsWithImages);

router.get("/get-images-by-album", albumControllers.imagesByAlbum);

router.get("/get-all-albums", albumControllers.allAlbumsAdmin);

router.get("/get-gallery", albumControllers.getgallery);

router.delete(
  "/delete-image",
  verifyTokenMiddleware,
  albumControllers.deleteImageById
);

router.post(
  "/update-album",
  verifyTokenMiddleware,
  albumControllers.updateAlbum
);

router.post(
  "/update-image",
  verifyTokenMiddleware,
  albumControllers.updateImage
);

router.post(
  "/upload-bulk",
  verifyTokenMiddleware,
  albumControllers.bulkImageUpload
);

router.get("/get-gallery", albumControllers.getgallery);

router.delete(
  "/delete-album",
  verifyTokenMiddleware,
  albumControllers.deleteAllAlbumImagesById
);

router.get("/get-homepage-gallery", albumControllers.getHomepageGallery);

module.exports = router;
