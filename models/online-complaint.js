const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const complaintSchema = new Schema(
  {
    psId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoliceStation",
    },
    complaintNo: { 
      type: String, 
      required: true,
      unique: true 
    },
    fullName: { type: String, required: true },
    contactNo: { type: String, required: true },
    actionTaken: { type: String, default: "pending" },
    remark: { type: String, required: false },
    email: { type: String, required: false },
    street: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pinCode: { type: String },
    complaint: { type: String, required: true },
    files: [{ type: String }],
    reg_id: { type: String },
  },
  {
    timestamps: true,
  }
);

// Function to generate complaint number
complaintSchema.statics.generateComplaintNo = async function() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Find the last complaint number for the current month
  const lastComplaint = await this.findOne({
    complaintNo: new RegExp(`^TPC${year}${month}`)
  }).sort({ complaintNo: -1 });
  
  let sequence = '0001';
  if (lastComplaint && lastComplaint.complaintNo) {
    const lastSequence = parseInt(lastComplaint.complaintNo.slice(-4));
    sequence = (lastSequence + 1).toString().padStart(4, '0');
  }
  
  return `TPC${year}${month}${sequence}`;
};

module.exports = mongoose.model("Complaint", complaintSchema);
