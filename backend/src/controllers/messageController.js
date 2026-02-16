const Message = require("../models/Message");

// Send msg
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    // Message send request received

    // Validation
    if (!receiverId || !content) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Receiver ID and content are required",
        data: null
      });
    }

    // Create Message
    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content
    });

    // Populate sender & receiver info
    const populatedMessage = await newMessage.populate([
      { path: "sender", select: "name profilePic" },
      { path: "receiver", select: "name profilePic" }
    ]);

    // Emit via socket
    const io = req.app.locals.io;
    if (io) {
      // Create chat room ID 
      const chatRoomId = [senderId, receiverId].sort().join("_");
      
      // Emit message via Socket.io
      io.to(chatRoomId).emit("receiveMessage", populatedMessage);
      
      // Also emit to individual user rooms (BACKUP)
      io.to(senderId).emit("receiveMessage", populatedMessage);
      io.to(receiverId).emit("receiveMessage", populatedMessage);

      // Send notification to receiver
      const roomSockets = io.sockets.adapter.rooms.get(chatRoomId);
      
      // If receiver is not in chat room, send notification
      if (!roomSockets || roomSockets.size < 2) {
        
        io.to(receiverId).emit("newNotification", {
          _id: populatedMessage._id,
          from: {
            _id: populatedMessage.sender._id,
            name: populatedMessage.sender.name,
            profilePic: populatedMessage.sender.profilePic
          },
          messagePreview: content.substring(0, 50),
          timestamp: new Date(),
          isRead: false
        });
        // Notification emitted
      }
      
    } else {
      console.error(" Socket.io instance not available!");
    }

    // finished processing sendMessage

    res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Message sent successfully",
      data: populatedMessage
    });

  } catch (error) {
    console.error(" Error sending message:", error);
    res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};


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
