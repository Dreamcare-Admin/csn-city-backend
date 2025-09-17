const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const WellfareSchema = new Schema(
  {
    title: { type: String, required: true },
    title_in_marathi: { type: String, required: true },
    photo: [{ type: String }],
    date: { type: String },
    about: { type: String },
    about_in_marathi: { type: String },
    tag: { type: String }, //wellfare, initiative
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Wellfare", WellfareSchema);
