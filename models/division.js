const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const DivisionSchema = new Schema(
  {
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    sr_no: { type: Number },
    acp_name: { type: String },
    acp_name_in_marathi: { type: String },
    acp_contact: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Division", DivisionSchema);
