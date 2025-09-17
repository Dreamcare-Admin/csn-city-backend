const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const albumSchema = new Schema(
  {
    title: { type: String, required: true },
    titleInMarathi: { type: String },
    description: { type: String },
    descriptionInMarathi: { type: String },
    link: { type: String },
    tag: { type: String }, // gallery, madia
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Album", albumSchema);
