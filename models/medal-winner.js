const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MedalWinnerSchema = new Schema(
  {
    sr_no: { type: Number },
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    photo: { type: String },
    designation: { type: String },
    designation_in_marathi: { type: String },
    date: { type: String },
    medal_type: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MedalWinner", MedalWinnerSchema);
