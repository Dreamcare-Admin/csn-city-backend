const express = require("express");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const ChatbotVisitorControllers = require("../controllers/chatbot-visitor-controllers");

const router = express.Router();

// Track chatbot visit (public endpoint)
router.post("/track-visit", ChatbotVisitorControllers.trackChatbotVisit);

// Get total chatbot visits (protected endpoint for admin)
router.get("/count", verifyTokenMiddleware, ChatbotVisitorControllers.getChatbotVisitCount);

// Get chatbot visit statistics (protected endpoint for admin)
router.get("/statistics", verifyTokenMiddleware, ChatbotVisitorControllers.getChatbotVisitStats);

module.exports = router; 