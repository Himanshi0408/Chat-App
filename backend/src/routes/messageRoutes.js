const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getChatHistory
} = require("../controllers/messageController");

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/:userId", protect, getChatHistory);

module.exports = router;
