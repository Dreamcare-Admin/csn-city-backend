const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const heroSchema = new Schema(
  {
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    photo: { type: String },
    year: { type: String },
    post: { type: String, required: true },
    post_in_marathi: { type: String, required: true },
    medal_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medal",
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Hero", heroSchema);
