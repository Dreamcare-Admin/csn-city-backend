const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const wellfarealbumSchema = new Schema(
  {
    title: { type: String, required: true },
    titleInMarathi: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WellfareAlbum", wellfarealbumSchema);
