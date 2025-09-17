const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const specialUnitSchema = new Schema(
  {
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    photo: { type: String },
    info: { type: String },
    info_in_marathi: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SpecialUnit", specialUnitSchema);
