
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getMyProfile,
  updateProfile,
  getAllUsers,
  getOnlineUsers
} = require("../controllers/userController");

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.put("/update", protect, updateProfile);
router.get("/", protect, getAllUsers);
router.get("/online", protect, getOnlineUsers);

module.exports = router;
