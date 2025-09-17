const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const DivACPSchema = new Schema(
  {
    sr_no: { type: Number },
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    photo: { type: String },
    designation: { type: String },
    designation_in_marathi: { type: String },
    phone: { type: String },
    email: { type: String },
    mobile: { type: String },
    // from_date: { type: String },
    // to_date: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ACP", DivACPSchema);
