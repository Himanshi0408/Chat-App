const Message = require("../models/Message");



/* ------------------ GET CHAT HISTORY ------------------ */
exports.getChatHistory = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name profilePic")
      .populate("receiver", "name profilePic");

    res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Chat history fetched successfully",
      totalMessages: messages.length,
      data: messages
    });

  } catch (error) {
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};
