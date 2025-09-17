const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const headlineSchema = new Schema(
  {
    title: { type: String, required: true },
    title_in_marathi: { type: String, required: true },
    value: { type: String },
    file_type: { type: String, required: true }, // link, pdf, text
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Headline", headlineSchema);
