const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAsRead,
  clearNotifications
} = require("../controllers/notificationController");

const router = express.Router();

// Get all notifications for current user
router.get("/", protect, getNotifications);

// Mark a notification as read
router.put("/:notificationId/read", protect, markAsRead);

// Clear all notifications
router.delete("/", protect, clearNotifications);

module.exports = router;
