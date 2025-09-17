const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatbotVisitorSchema = new Schema({
  count: { type: Number, default: 0 },
  visitedAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model("ChatbotVisitor", chatbotVisitorSchema); 