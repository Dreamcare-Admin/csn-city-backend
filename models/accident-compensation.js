const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const accidentSchema = new Schema(
  {
    cr_no: { type: String },
    year: { type: String },
    date: { type: String },
    comm_aa: { type: String },
    fir_file: { type: String },
    psId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoliceStation",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AccidentCompensation", accidentSchema);
