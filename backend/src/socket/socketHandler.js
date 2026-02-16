const Message = require("../models/Message");
const User = require("../models/User");

const socketHandler = (io) => {
  let onlineUsers = new Map();
  let chatRooms = new Map();

  io.on("connection", async (socket) => {

    // Add socket to onlineUsers
    if (!onlineUsers.has(socket.userId)) onlineUsers.set(socket.userId, new Set());
    onlineUsers.get(socket.userId).add(socket.id);

    await User.findByIdAndUpdate(socket.userId, { isOnline: true });

    // Broadcast online status
    io.emit("userOnline", { userId: socket.userId, isOnline: true });
    io.emit("onlineUsersList", Array.from(onlineUsers.keys()));

    socket.on("join", (userId) => {
      socket.join(userId);
    });

    // Join chat room
    socket.on("joinChatRoom", (chatRoomId) => {
      socket.join(chatRoomId);
      
      if (!chatRooms.has(chatRoomId)) {
        chatRooms.set(chatRoomId, new Set());
      }
      chatRooms.get(chatRoomId).add(socket.id);

      const roomSize = io.sockets.adapter.rooms.get(chatRoomId)?.size || 0;

      // Socket joined chat room
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      try {
        const sockets = onlineUsers.get(socket.userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(socket.userId);

            await User.findByIdAndUpdate(socket.userId, {
              isOnline: false,
              lastSeen: new Date(),
            });

            io.emit("userOffline", { userId: socket.userId, isOnline: false });
          }
        }

        // Clean up chat rooms
        for (let [roomId, roomSockets] of chatRooms) {
          roomSockets.delete(socket.id);
          if (roomSockets.size === 0) {
            chatRooms.delete(roomId);
          }
        }

        io.emit("onlineUsersList", Array.from(onlineUsers.keys()));
        // Socket disconnected
      } catch (err) {
        console.error(" Error on disconnect:", err);
      }
    });
  });
};

module.exports = socketHandler;
