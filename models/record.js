const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const recordSchema = new Schema(
  {
    date: { type: String },
    title: { type: String, required: true },
    titleInMarathi: { type: String, required: true },
    pdflink: { type: String, required: true },
    tag: { type: String, required: true }, //
  },
  {
    timestamps: true,
  }
);

recordSchema.index({ tag: 1 });

module.exports = mongoose.model("Record", recordSchema);

// tags list

// download_forms
// mob_violence
// good_work
// circular
// press_release
// right_to_service
// information_for_police_officers
// tenders
// recruitment
// nagarikanchi_sanad
// atrocity_cases
// right_to_information
// absconder_list
// crime_statistics
// drunk_and_drive
// externee
// ncrb
// bandifarari

//recruit
//press_release
//rti
//tenders
//circular
//good_work
//mob_voilence
//atrocity_cases, crime_statistics                 inside crime review
