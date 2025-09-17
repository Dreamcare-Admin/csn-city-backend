const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const impcontactSchema = new Schema(
  {
    address: { type: String, required: true },
    address_in_marathi: { type: String, required: true },
    telephone: { type: String, required: true },
    fax: { type: String },
    email: { type: String, required: true },
    sr_no: { type: Number, required: true },
    mobile: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ImpContact", impcontactSchema);
