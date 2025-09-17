const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const tenantSchema = new Schema(
  {
    //property owner fields
    psId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoliceStation",
    },
    ownerPhoto: { type: String, required: true },
    fullName: { type: String, required: true },
    contactNo: { type: String, required: true },
    email: { type: String, required: false },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pinCode: { type: String },

    //rented property details

    rentPropertyAddress: { type: String, required: true },
    rentPropertyCity: { type: String },
    rentPropertyState: { type: String },
    rentPropertyPincode: { type: String },
    agreementStartDate: { type: String, required: true },
    agreementEndDate: { type: String, required: true },

    // TENANT INFO

    tenantName: { type: String, required: true },
    tenantPhoto: { type: String, required: true },
    tenantPermanentAddress: { type: String, required: true },
    tenantCity: { type: String, required: true },
    tenantState: { type: String, required: true },
    tenantPincode: { type: String, required: true },
    tenantIdentityProof: { type: String, required: true },
    tenantIdentityProofNo: { type: String, required: true },
    tenantIdentityProofDoc: { type: String, required: true },
    numberOfMale: { type: String },
    numberOfFemale: { type: String },
    numberOfChild: { type: String },

    // TENANT WORK PLACE INFO

    tenantMobNo: { type: String, required: true },
    tenantEmail: { type: String, required: false },
    tenantOccupation: { type: String, required: true },

    tenantPlaceOfWork: { type: String, required: true },
    tenantPlaceOfWorkCity: { type: String, required: true },
    tenantPlaceOfWorkState: { type: String, required: true },
    tenantPlaceOfWorkPincode: { type: String, required: true },

    // PERSONS KNOWN TENANT INFO

    knownPerson1: { type: String, required: true },
    knownPerson2: { type: String, required: true },
    knownPerson1Contact: { type: String, required: true },
    knownPerson2Contact: { type: String, required: true },
    agentName: { type: String },
    agentDetails: { type: String },

    reg_id: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Tenant", tenantSchema);
