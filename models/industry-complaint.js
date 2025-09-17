const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const industrycomplaintSchema = new Schema(
  {
    psId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoliceStation",
    },
    fullName: { type: String, required: true },
    contactNo: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String },
    address: { type: String },
    city: { type: String },

    state: { type: String },
    country: { type: String },
    pinCode: { type: String },
    subject: { type: String },

    complaint: { type: String, required: true },
    files: [{ type: String }],

    reg_id: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("IndustryComplaint", industrycomplaintSchema);
