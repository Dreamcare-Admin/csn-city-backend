const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const usefulwebSchema = new Schema(
  {
    title: { type: String, required: true },
    titleInMarathi: { type: String, required: true },
    link: { type: String, required: true },
    priority: { type: Number },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Usefulweb", usefulwebSchema);
