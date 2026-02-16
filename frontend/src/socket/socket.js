import { io } from "socket.io-client";

let socket = null;

export const initSocket = (token) => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on("connect", () => {
      // socket connected
    });

    socket.on("disconnect", () => {
      // socket disconnected
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }
  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default socket;
