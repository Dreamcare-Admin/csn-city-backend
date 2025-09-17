const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const visitorSchema = new Schema({
  count: { type: Number },
});

module.exports = mongoose.model("Visitor", visitorSchema);
