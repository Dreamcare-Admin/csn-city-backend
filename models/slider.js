const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const sliderSchema = new Schema(
  {
    imagelink: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Slider", sliderSchema);
