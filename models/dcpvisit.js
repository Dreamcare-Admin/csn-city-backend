const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dcpSchema = new Schema(
  {
    psId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoliceStation",
    },
    first_date: { type: String, required: true },
    second_date: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Dcpvisit", dcpSchema);
