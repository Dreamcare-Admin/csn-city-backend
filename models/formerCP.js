const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const formerADGSchema = new Schema(
  {
    sr_no: { type: Number, required: true },
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    photo: { type: String },
    designation: { type: String },
    designation_in_marathi: { type: String },
    from_date: { type: String },
    to_date: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FormerCP", formerADGSchema);
