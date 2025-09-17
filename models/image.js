const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const imageSchema = new Schema(
  {
    album: { type: mongoose.Schema.Types.ObjectId, ref: "Album" },
    description: { type: String },
    descriptionInMarathi: { type: String },
    imagelink: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Image", imageSchema);
