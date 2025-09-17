const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const svgCaptcha = require("svg-captcha");
const axios = require("axios");
const crypto = require("crypto");
const Visitor = require("../models/visitor");
const OnlineComplaint = require("../models/online-complaint");
const IndustryComplaint = require("../models/industry-complaint");
const LostFound = require("../models/lostfound");
const Tenant = require("../models/Tenant");
const Feedback = require("../models/Feedback");
const AccidentCompensation = require("../models/accident-compensation");
const PoliceStation = require("../models/police-station");
require("dotenv").config();

const getcaptcha = async (req, res, next) => {
  try {
    var captcha = svgCaptcha.create((size = 6));

    const captchaData = {
      svg: captcha.data,
      text: captcha.text,
    };

    res.status(200).json({ success: true, captcha: captchaData });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

function generateOTP() {
  // Generate a random 4-digit number
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString(); // Convert the number to a string
}

const getOTP = async (req, res, next) => {
  const { phonenumber } = req.query;

  const otp = generateOTP();

  //   const hashedData = crypto.createHash("sha256").update(otp).digest("hex");

  //   console.log(hashedData);

  const secret = "gold414@124&45";
  const hashedData = crypto
    .createHmac("sha256", secret)
    .update(otp)
    .digest("hex");

  try {
    const response = await axios.get(
      `http://web.smsgw.in/smsapi/httpapi.jsp?username=mbvvpc&password=123123&from=MAHPOL&to=${phonenumber}&text=OTP is ${otp} Police Website MAHPOL&pe_id=1601100000000004090&template_id=1607100000000054716&coding=0`
    );

    return res.status(200).json({ success: true, data: hashedData });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getVisitorCount = async (req, res, next) => {
  try {
    // Find the visitor record, if it exists
    let visitor = await Visitor.findOne();

    // If visitor record doesn't exist, create a new one
    if (!visitor) {
      visitor = new Visitor({ count: 1 });
    } else {
      // Increment the visitor count
      visitor.count++;
    }

    // Save the updated visitor record
    await visitor.save();

    // Send the updated count in the response
    res.json({ count: visitor.count });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const getStatistics = async (req, res, next) => {
  try {
    // Get current date and date 12 months ago
    const currentDate = new Date();
    const lastYear = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));

    // Get all police stations for reference
    const policeStations = await PoliceStation.find({}, 'name');
    
    // Aggregate data for each model
    const [
      onlineComplaints,
      industryComplaints,
      lostFound,
      tenantInfo,
      feedback,
      accidentCompensation
    ] = await Promise.all([
      // Online Complaints Statistics
      OnlineComplaint.aggregate([
        {
          $facet: {
            'total': [{ $count: 'count' }],
            'byStatus': [
              { $group: { _id: '$actionTaken', count: { $sum: 1 } } }
            ],
            'byPoliceStation': [
              { $group: { _id: '$psId', count: { $sum: 1 } } }
            ],
            'monthlyTrend': [
              {
                $match: {
                  createdAt: { $gte: lastYear }
                }
              },
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),

      // Industry Complaints Statistics
      IndustryComplaint.aggregate([
        {
          $facet: {
            'total': [{ $count: 'count' }],
            'byPoliceStation': [
              { $group: { _id: '$psId', count: { $sum: 1 } } }
            ],
            'monthlyTrend': [
              {
                $match: {
                  createdAt: { $gte: lastYear }
                }
              },
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),

      // Lost & Found Statistics
      LostFound.aggregate([
        {
          $facet: {
            'total': [{ $count: 'count' }],
            'byType': [
              { $group: { _id: '$report_type', count: { $sum: 1 } } }
            ],
            'byPoliceStation': [
              { $group: { _id: '$psId', count: { $sum: 1 } } }
            ],
            'monthlyTrend': [
              {
                $match: {
                  createdAt: { $gte: lastYear }
                }
              },
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),

      // Tenant Info Statistics
      Tenant.aggregate([
        {
          $facet: {
            'total': [{ $count: 'count' }],
            'byPoliceStation': [
              { $group: { _id: '$psId', count: { $sum: 1 } } }
            ],
            'monthlyTrend': [
              {
                $match: {
                  createdAt: { $gte: lastYear }
                }
              },
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),

      // Feedback Statistics
      Feedback.aggregate([
        {
          $facet: {
            'total': [{ $count: 'count' }],
            'byCategory': [
              { $group: { _id: '$category', count: { $sum: 1 } } }
            ],
            'byPoliceStation': [
              { $group: { _id: '$psId', count: { $sum: 1 } } }
            ],
            'monthlyTrend': [
              {
                $match: {
                  createdAt: { $gte: lastYear }
                }
              },
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),

      // Accident Compensation Statistics
      AccidentCompensation.aggregate([
        {
          $facet: {
            'total': [{ $count: 'count' }],
            'byPoliceStation': [
              { $group: { _id: '$psId', count: { $sum: 1 } } }
            ],
            'monthlyTrend': [
              {
                $match: {
                  createdAt: { $gte: lastYear }
                }
              },
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              }
            ],
            'byYear': [
              { $group: { _id: '$year', count: { $sum: 1 } } }
            ]
          }
        }
      ])
    ]);

    // Map police station IDs to names
    const psIdToName = {};
    policeStations.forEach(ps => {
      psIdToName[ps._id] = ps.name;
    });

    // Format the response
    const statistics = {
      onlineComplaints: {
        total: onlineComplaints[0].total[0]?.count || 0,
        byStatus: onlineComplaints[0].byStatus,
        byPoliceStation: onlineComplaints[0].byPoliceStation.map(item => ({
          policeStation: psIdToName[item._id] || 'Unknown',
          count: item.count,
          psId: item._id
        })),
        monthlyTrend: onlineComplaints[0].monthlyTrend
      },
      industryComplaints: {
        total: industryComplaints[0].total[0]?.count || 0,
        byPoliceStation: industryComplaints[0].byPoliceStation.map(item => ({
          policeStation: psIdToName[item._id] || 'Unknown',
          count: item.count,
          psId: item._id
        })),
        monthlyTrend: industryComplaints[0].monthlyTrend
      },
      lostFound: {
        total: lostFound[0].total[0]?.count || 0,
        byType: lostFound[0].byType,
        byPoliceStation: lostFound[0].byPoliceStation.map(item => ({
          policeStation: psIdToName[item._id] || 'Unknown',
          count: item.count,
          psId: item._id
        })),
        monthlyTrend: lostFound[0].monthlyTrend
      },
      tenantInfo: {
        total: tenantInfo[0].total[0]?.count || 0,
        byPoliceStation: tenantInfo[0].byPoliceStation.map(item => ({
          policeStation: psIdToName[item._id] || 'Unknown',
          count: item.count,
          psId: item._id
        })),
        monthlyTrend: tenantInfo[0].monthlyTrend
      },
      feedback: {
        total: feedback[0].total[0]?.count || 0,
        byCategory: feedback[0].byCategory,
        byPoliceStation: feedback[0].byPoliceStation.map(item => ({
          policeStation: psIdToName[item._id] || 'Unknown',
          count: item.count,
          psId: item._id
        })),
        monthlyTrend: feedback[0].monthlyTrend
      },
      accidentCompensation: {
        total: accidentCompensation[0].total[0]?.count || 0,
        byPoliceStation: accidentCompensation[0].byPoliceStation.map(item => ({
          policeStation: psIdToName[item._id] || 'Unknown',
          count: item.count,
          psId: item._id
        })),
        monthlyTrend: accidentCompensation[0].monthlyTrend,
        byYear: accidentCompensation[0].byYear
      }
    };

    res.json({ statistics });
  } catch (err) {
    console.error(err);
    return next(new Error('Failed to fetch statistics'));
  }
};

const getComplaintStatus = async (req, res, next) => {
  const { complaintNo } = req.query;

  if (!complaintNo) {
    return res.status(400).json({
      success: false,
      message: "Complaint number is required"
    });
  }

  try {
    const complaint = await OnlineComplaint.findOne({ complaintNo })
      .populate('psId', 'name');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    res.status(200).json({
      success: true,
      complaint: {
        complaintNo: complaint.complaintNo,
        actionTaken: complaint.actionTaken,
        remark: complaint.remark,
        psId: complaint.psId,
        createdAt: complaint.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};

const addComplaint = async (req, res, next) => {
  const {
    psId,
    fullName,
    contactNo,
    email,
    street,
    address,
    city,
    state,
    country,
    pinCode,
    complaint,
  } = req.body;

  try {
    // Generate complaint number
    const complaintNo = await OnlineComplaint.generateComplaintNo();
    
    // Generate registration ID (keeping existing format)
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const reg_id = `OC${month}${day}${hours}${minutes}${seconds}`;

    let files = [];
    if (req.files) {
      files = req.files.map(file => file.location);
    }

    const newComplaint = new OnlineComplaint({
      psId,
      complaintNo,
      reg_id,
      fullName,
      contactNo,
      email,
      street,
      address,
      city,
      state,
      country,
      pinCode,
      complaint,
      files
    });

    await newComplaint.save();

    res.status(201).json({
      success: true,
      id: newComplaint._id,
      complaintNo: complaintNo,
      message: "Complaint registered successfully"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to register complaint"
    });
  }
};

module.exports = {
  getcaptcha,
  getOTP,
  getVisitorCount,
  getStatistics,
  getComplaintStatus,
  addComplaint
};
