const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const ReportUsControllers = require("../controllers/report-us-controllers");

const router = express.Router();

router.post("/add-complaint", ReportUsControllers.createComplaint);

router.get(
  "/get-complaint-list",
  verifyTokenMiddleware,
  ReportUsControllers.getComplaintList
);

router.delete(
  "/delete-complaint",
  verifyTokenMiddleware,

  ReportUsControllers.deleteOnlineComplaint
);

router.get("/get-complaint-data", ReportUsControllers.getOnlineComplaintbyId);

router.post("/add-lost-found", ReportUsControllers.createLostFound);

router.post("/update-complaint-action", ReportUsControllers.getUpdateComplaintbyId);

router.get(
  "/get-lost-found-list",
  verifyTokenMiddleware,
  ReportUsControllers.getLostFoundList
);

router.delete(
  "/delete-lost-found",
  verifyTokenMiddleware,

  ReportUsControllers.deleteLostFound
);

router.get("/get-lost-found-data", ReportUsControllers.getLostFoundbyId);

router.post("/add-feedback", ReportUsControllers.createFeedback);

router.get(
  "/get-feedback-list",
  verifyTokenMiddleware,
  ReportUsControllers.getFeedbackList
);

router.delete(
  "/delete-feedback",
  verifyTokenMiddleware,

  ReportUsControllers.deleteFeedback
);

router.get("/get-feedback-data", ReportUsControllers.getFeedbackbyId);

router.post("/add-tenant-info", ReportUsControllers.createTenantInfo);

router.get("/get-tenant-data", ReportUsControllers.getTenantDatabyId);

router.get(
  "/get-tenant-list",
  verifyTokenMiddleware,
  ReportUsControllers.getTenantList
);

router.get(
  "/get-tenant-by-filter",
  verifyTokenMiddleware,
  ReportUsControllers.getTenantListByFilter
);

router.delete(
  "/delete-tenant",
  verifyTokenMiddleware,

  ReportUsControllers.deleteTenant
);

router.post(
  "/add-industry-complaint",
  ReportUsControllers.createIndustryComplaint
);

router.get(
  "/get-industry-complaint-list",
  verifyTokenMiddleware,
  ReportUsControllers.getIndustryComplaintList
);

router.delete(
  "/delete-industry-complaint",
  verifyTokenMiddleware,

  ReportUsControllers.deleteOnlineIndustryComplaint
);

router.get(
  "/get-industry-complaint-data",
  ReportUsControllers.getOnlineIndustryComplaintbyId
);

module.exports = router;
