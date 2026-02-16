
// Get all notifications for a user 
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Notifications fetched successfully",
      data: [],
      note: "Notifications are sent in real-time via Socket.io"
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

// Mark notification as read 
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    const userId = req.user._id;
    res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Notification marked as read"
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

// Clear all notifications for user 
exports.clearNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    res.status(200).json({
      statusCode: 200,
      success: true,
      message: "All notifications cleared"
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
