const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const RegionSchema = new Schema(
  {
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    racp_name: { type: String },
    racp_name_in_marathi: { type: String },
    racp_contact: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Region", RegionSchema);
