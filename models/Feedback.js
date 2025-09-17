const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const FeedbackSchema = new Schema(
  {
    category: { type: String, required: true },
    psId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoliceStation",
    },
    fullName: { type: String, required: true },
    contactNo: { type: String, required: true },
    email: { type: String},
    subject: { type: String, required: true },

    address: { type: String },

    description: { type: String, required: true },
    reg_id: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
