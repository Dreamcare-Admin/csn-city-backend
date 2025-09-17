const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const albumControllers = require("../controllers/wellfarealbum-controllers");

const router = express.Router();

router.post(
  "/wellare-add-album",
  verifyTokenMiddleware,
  albumControllers.createAlbum
);

router.post(
  "/wellare-add-image",
  verifyTokenMiddleware,
  albumControllers.addImage
);

router.get("/wellare-get-images-by-album", albumControllers.imagesByAlbum);

router.get("/wellare-get-all-albums", albumControllers.allAlbumsAdmin);

router.get(
  "/wellare-get-groupby-albums",
  albumControllers.allAlbumsAdminbyGroup
);

router.delete(
  "/wellare-delete-image",
  verifyTokenMiddleware,
  albumControllers.deleteImageById
);

router.post(
  "/wellare-update-album",
  verifyTokenMiddleware,
  albumControllers.updateAlbum
);

router.post(
  "/wellare-update-image",
  verifyTokenMiddleware,
  albumControllers.updateImage
);

router.post(
  "/wellare-upload-bulk",
  verifyTokenMiddleware,
  albumControllers.bulkImageUpload
);

module.exports = router;
