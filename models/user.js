const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 5 },
    passwordHistory: [{ type: String }],
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    mobile_no: { type: String },
    otp: { type: String },
    passwordChangedAt: { type: Date },
    activeTokens: [{ 
      token: { type: String },
      deviceInfo: {
        userAgent: { type: String },
        platform: { type: String },
        language: { type: String },
        ipAddress: { type: String }
      },
      createdAt: { type: Date, default: Date.now }
    }], // Store multiple active tokens for concurrent sessions
    blacklistedTokens: [{ type: String }], // Store previously invalidated tokens
    psId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoliceStation",
    },
    role: { type: String, required: true, default: "user" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
