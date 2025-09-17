const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UnitofficerSchema = new Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialUnit",
    },
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    date_of_joining: { type: String },
    post: { type: String },
    post_in_marathi: { type: String },

    contact_no: { type: String },
    email: { type: String },
    officer_photo: { type: String },
    priority: { type: Number },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UnitOfficer", UnitofficerSchema);
