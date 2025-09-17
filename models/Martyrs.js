const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MartyrsSchema = new Schema(
  {
    sr_no: { type: Number },
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },

    area: { type: String },
    area_in_marathi: { type: String },

    incident: { type: String },
    incident_in_marathi: { type: String },

    post: { type: String },
    post_in_marathi: { type: String },

    birth_date: { type: String },
    joining_date: { type: String },
    martyrs_date: { type: String },

    birth_place: { type: String },
    birth_place_in_marathi: { type: String },

    father_name: { type: String },
    father_name_in_marathi: { type: String },

    photo: { type: String },

    details: { type: String },
    details_in_marathi: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Martyrs", MartyrsSchema);
