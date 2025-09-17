const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const policeStationSchema = new Schema(
  {
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    photo: { type: String },
    map_photo: { type: String },
    maplink: { type: String },
    address: { type: String },
    address_in_marathi: { type: String },
    email: { type: String },
    contact_no: { type: String },
    contact_no2: { type: String },
    contact_no3: { type: String },

    si_court: { type: String },
    si_court_in_marathi: { type: String },
    si_pi_crime: { type: String },
    si_pi_crime_in_marathi: { type: String },
    si_pi_crime_contact: { type: String },

    si_pi_admin: { type: String },
    si_pi_admin_in_marathi: { type: String },
    si_pi_admin_contact: { type: String },

    si_number_of_beat: { type: String },
    si_area_sq_kms: { type: String },
    si_population: { type: String },
    si_no_of_beat_marshalls: { type: String },

    si_bit_chowki: { type: String },
    si_bit_chowki_in_marathi: { type: String },

    latitude: { type: Number },
    longitude: { type: Number },

    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PoliceStation", policeStationSchema);
