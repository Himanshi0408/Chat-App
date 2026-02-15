const Message = require("../models/Message");
const User = require("../models/User");

const socketHandler = (io) => {
  let onlineUsers = new Map();

  io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.userId} | Socket: ${socket.id}`);

    // Add socket to onlineUsers
    if (!onlineUsers.has(socket.userId)) onlineUsers.set(socket.userId, new Set());
    onlineUsers.get(socket.userId).add(socket.id);

    // Mark user as online in database
    await User.findByIdAndUpdate(socket.userId, { isOnline: true });

    // Broadcast online status and updated list
    io.emit("userOnline", { userId: socket.userId, isOnline: true });
    io.emit("onlineUsersList", Array.from(onlineUsers.keys()));

    // Join user to their own room for targeted messaging
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room ${userId}`);
    });

    // Send message
  // 

    // Handle user disconnect
    socket.on("disconnect", async () => {
      try {
        const sockets = onlineUsers.get(socket.userId);
        if (sockets) {
          sockets.delete(socket.id);
          // If no more sockets for this user, mark as offline
          if (sockets.size === 0) {
            onlineUsers.delete(socket.userId);

            // Mark user as offline in database
            await User.findByIdAndUpdate(socket.userId, {
              isOnline: false,
              lastSeen: new Date(),
            });

            // Broadcast offline status
            io.emit("userOffline", { userId: socket.userId, isOnline: false });
          }
        }

        // Update online users list
        io.emit("onlineUsersList", Array.from(onlineUsers.keys()));
        console.log(`User disconnected: ${socket.userId} | Socket: ${socket.id}`);
      } catch (err) {
        console.error("Error on disconnect:", err);
      }
    });
  });
};

module.exports = socketHandler;
