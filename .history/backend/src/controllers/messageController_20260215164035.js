const Message = require("../models/Message");

/* ------------------ SEND MESSAGE ------------------ */
// exports.sendMessage = async (req, res) => {
//   try {
//     const { receiverId, content } = req.body;

//     // Validation
//     if (!receiverId || !content) {
//       return res.status(400).json({
//         statusCode: 400,
//         success: false,
//         message: "Receiver ID and content are required",
//         data: null
//       });
//     }

//     // Create Message
//     const newMessage = await Message.create({
//       sender: req.user._id,
//       receiver: receiverId,
//       content
//     });

//     // Populate sender & receiver info
//     const populatedMessage = await newMessage.populate([
//       { path: "sender", select: "name profilePic" },
//       { path: "receiver", select: "name profilePic" }
//     ]);

//     res.status(201).json({
//       statusCode: 201,
//       success: true,
//       message: "Message sent successfully",
//       data: populatedMessage
//     });

//   } catch (error) {
//     res.status(500).json({
//       statusCode: 500,
//       success: false,
//       message: "Server Error",
//       error: error.message
//     });
//   }
// };
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "All fields required" });
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    const populatedMessage = await newMessage.populate([
      { path: "sender", select: "name profilePic" },
      { path: "receiver", select: "name profilePic" }
    ]);

    //  Emit from backend
    const io = req.app.get("io");

    io.to(receiverId).emit("receiveMessage", populatedMessage);
    io.to(req.user._id.toString()).emit("receiveMessage", populatedMessage);

    res.status(201).json(populatedMessage);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
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
