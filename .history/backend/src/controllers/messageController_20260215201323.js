const Message = require("../models/Message");

/* ------------------ SEND MESSAGE ------------------ */
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

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
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    // Populate sender & receiver info
    const populatedMessage = await newMessage.populate([
      { path: "sender", select: "name profilePic" },
      { path: "receiver", select: "name profilePic" }
    ]);

    // Emit message to both sender and receiver via socket
    const io = req.app.locals.io;
    if (io) {
      console.log(`Emitting message to sender: ${req.user._id} and receiver: ${receiverId}`);
      io.to(receiverId).emit("receiveMessage", populatedMessage);
      // Emit to sender's room
      io.to(req.user._id).emit("receiveMessage", populatedMessage);
    } else {
      console.warn("Socket.io instance not available in messageController");
    }

    res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Message sent successfully",
      data: populatedMessage
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
