const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const lostfoundSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    contactNo: { type: String, required: true },

    address: { type: String },
    pinCode: { type: String },
    psId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoliceStation",
    },

    report_type: { type: String },
    article_type: { type: String },
    article_address: { type: String },
    datetime: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    article_pincode: { type: String },

    description: { type: String, required: true },

    reg_id: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LostFound", lostfoundSchema);
