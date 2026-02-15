
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");
const Message = require("./src/models/Message");

const app = express();

// Connect Database
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/chat", require("./src/routes/messageRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));


const server = http.createServer(app);

// Socket.io setup with JWT authentication
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", async (socket) => {
  console.log(`User connected: ${socket.userId} | Socket: ${socket.id}`);

  // Add socket to onlineUsers
  if (!onlineUsers.has(socket.userId)) onlineUsers.set(socket.userId, new Set());
  onlineUsers.get(socket.userId).add(socket.id);

  await User.findByIdAndUpdate(socket.userId, { isOnline: true });

  // Broadcast online status and updated list
  io.emit("userOnline", { userId: socket.userId, isOnline: true });
  io.emit("onlineUsersList", Array.from(onlineUsers.keys()));

  // Send message
  socket.on("sendMessage", async (data) => {
    try {
      const message = await Message.create({
        sender: data.sender,
        receiver: data.receiver,
        content: data.content,
        createdAt: data.createdAt || new Date(),
      });

      const receiverSockets = onlineUsers.get(data.receiver);
      if (receiverSockets) {
        receiverSockets.forEach((sid) => {
          io.to(sid).emit("receiveMessage", message);
          io.to(sid).emit("messageNotification", {
            from: data.sender,
            senderName: data.senderName,
            message: data.content,
            timestamp: message.createdAt,
          });
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  });

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

      // Update online users list
      io.emit("onlineUsersList", Array.from(onlineUsers.keys()));
      console.log(`User disconnected: ${socket.userId} | Socket: ${socket.id}`);
    } catch (err) {
      console.error("Error on disconnect:", err);
    }
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
