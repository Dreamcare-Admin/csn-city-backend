const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const Video = require("../models/video");

require("dotenv").config();

const addVideo = async (req, res, next) => {
  const { title, titleInMarathi, link } = req.body;

  const createdVideo = new Video({
    title,
    titleInMarathi,
    link,
  });

  try {
    await createdVideo.save();

    res
      .status(201)
      .json({ success: true, message: "new video added successfully!" });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const getVideos = async (req, res, next) => {
  let videos;

  try {
    videos = await Video.find({}).sort({ createdAt: -1 });

    res.status(200).json({ videos });
  } catch (err) {
    const error = new HttpError(
      "something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "something went wrong" });
    return next(error);
  }
};

const updateVideo = async (req, res, next) => {
  const { Id } = req.query;

  const { title, titleInMarathi, link } = req.body;

  try {
    const videolink = await Video.findById(Id);

    if (!videolink) {
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    videolink.title = title;
    videolink.titleInMarathi = titleInMarathi;
    videolink.link = link;

    await videolink.save();

    res
      .status(200)
      .json({ success: true, message: "video data updated successfully!" });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "Something went wrong" });
    return next(error);
  }
};

const deleteVideoById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    await Video.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, please try again later.",
      500
    );
    res.status(500).json({ success: false, message: "Something went wrong" });
    return next(error);
  }
};

exports.addVideo = addVideo;

exports.getVideos = getVideos;

exports.updateVideo = updateVideo;

exports.deleteVideoById = deleteVideoById;
