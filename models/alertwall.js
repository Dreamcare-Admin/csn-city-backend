const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const alertwallSchema = new Schema(
  {
    title: { type: String, required: true },
    title_in_marathi: { type: String, required: true },
    value: { type: String },
    tag: { type: String }, //citizen, cyber, safety
    file_type: { type: String, required: true }, // link, pdf, text, youtube, image
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alertwall", alertwallSchema);
