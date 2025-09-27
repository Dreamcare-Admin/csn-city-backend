const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const cors = require("cors");

const HttpError = require("./models/http-error");
const mainRoutes = require("./routes/main-routes");
const alertwallRoutes = require("./routes/alertwall-routes");
const SeniorOfficerRoutes = require("./routes/senior-officer-routes");
const videoRoutes = require("./routes/video-routes");
const ImpContactRoutes = require("./routes/imp-contact-routes");
const policeStationRoutes = require("./routes/police-station-routes");
const psOfficerRoutes = require("./routes/ps-officer-routes");
const GeneralRoutes = require("./routes/general-routes");
const UserRoutes = require("./routes/user-routes");
const authRoutes = require("./routes/auth-routes");
const spMessageRoutes = require("./routes/sp-message-routes");
const headlineRoutes = require("./routes/headline-routes");
const usefulwebRoutes = require("./routes/usefulweb-routes");
const albumRoutes = require("./routes/album-routes");
const sliderRoutes = require("./routes/homeslider-routes");
const ReportUsRoutes = require("./routes/report-us-routes");
const SpecialUnitRoutes = require("./routes/special-unit-routes");
const SpecialUnitOfficerRoutes = require("./routes/unit-officer-routes");
const DivisionRoutes = require("./routes/division-routes");
const wellfareRoutes = require("./routes/wellfare-routes");
const AccidentCompensationRoutes = require("./routes/accident-compensation-routes");
const YearRoutes = require("./routes/year-routes");
const ZoneRoutes = require("./routes/zone-routes");
const DcpvisitRoutes = require("./routes/dcp-visit-routes");
const ACPRoutes = require("./routes/acp-routes");
const FormerCPRoutes = require("./routes/former-cp-routes");
const MedalWinnerRoutes = require("./routes/medal-winner-routes");
const RegionRoutes = require("./routes/region-routes");
const chatbotVisitorRoutes = require("./routes/chatbot-visitor-routes");

require("dotenv").config();

const app = express();

// Trust proxy configuration for proper IP detection behind load balancers/proxies
app.set('trust proxy', true);

const allowedOrigins = [
  "http://localhost:3000",
  "https://csn-city.vercel.app",
];


// Set up CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Check if the origin is in the list of allowed origins
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Allow the request
    } else {
      callback("Not allowed by CORS"); // Deny the request.
    }
  },
};

app.use(bodyParser.json());
app.use(cors(corsOptions));

app.disable("x-powered-by");
app.disable("etag");

app.use("/api", mainRoutes);
app.use("/api", alertwallRoutes);
app.use("/api", SeniorOfficerRoutes);
app.use("/api", videoRoutes);
app.use("/api", ImpContactRoutes);
app.use("/api", policeStationRoutes);
app.use("/api", psOfficerRoutes);
app.use("/api", GeneralRoutes);
app.use("/api", UserRoutes);
app.use("/api", authRoutes);
app.use("/api", spMessageRoutes);
app.use("/api", headlineRoutes);
app.use("/api", usefulwebRoutes);
app.use("/api", albumRoutes);
app.use("/api", sliderRoutes);
app.use("/api", ReportUsRoutes);
app.use("/api", SpecialUnitRoutes);
app.use("/api", SpecialUnitOfficerRoutes);
app.use("/api", DivisionRoutes);
app.use("/api", wellfareRoutes);
app.use("/api", AccidentCompensationRoutes);
app.use("/api", YearRoutes);
app.use("/api", ZoneRoutes);
app.use("/api", DcpvisitRoutes);
app.use("/api", ACPRoutes);
app.use("/api", FormerCPRoutes);
app.use("/api", MedalWinnerRoutes);
app.use("/api", RegionRoutes);
app.use("/api/chatbot-visitor", chatbotVisitorRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could Not find this route", 404);
  res
    .status(400)
    .json({ success: false, message: "Could not find this route" });
});

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });
