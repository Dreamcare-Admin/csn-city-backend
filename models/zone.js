const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ZoneSchema = new Schema(
  {
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    dcp_name: { type: String },
    dcp_name_in_marathi: { type: String },
    dcp_contact: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Zone", ZoneSchema);
