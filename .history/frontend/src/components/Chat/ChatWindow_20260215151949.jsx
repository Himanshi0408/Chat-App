import React, { useEffect, useState, useRef, useContext } from "react";
import { initSocket, getSocket, disconnectSocket } from "../../socket/socket";
import MessageInput from "./MessageInput";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import axios from "../../api/axios";

export default function ChatWindow({ chatWith }) {
  const { user } = useContext(AuthContext);
  const { messages, setMessagesForChat, addMessage, updateOnlineUsers } = useContext(ChatContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [notification, setNotification] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch chat history from database
  useEffect(() => {
    async function fetchChatHistory() {
      try {
        setLoading(true);
        setError(null);
        const { data: response } = await axios.get(`/chat/${chatWith._id}`);
        const chatMessages = response.data || [];
        setMessagesForChat(chatMessages);
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
        setError("Failed to load chat history");
        setMessagesForChat([]);
      } finally {
        setLoading(false);
      }
    }

    if (chatWith?._id) {
      fetchChatHistory();
    }
  }, [chatWith?._id, setMessagesForChat]);

  // Check if recipient is currently online
  useEffect(() => {
    async function checkRecipientOnlineStatus() {
      try {
        const { data: response } = await axios.get("/users/online");
        const onlineUsers = response.data || [];
        const isOnline = onlineUsers.some(u => u._id === chatWith._id);
        setRecipientOnline(isOnline);
      } catch (err) {
        console.error("Failed to check online status:", err);
      }
    }

    if (chatWith?._id) {
      checkRecipientOnlineStatus();
    }
  }, [chatWith?._id]);

  // Socket.io connection - initialize once with authentication
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || !user?._id) return;

    const socket = initSocket(token);

    if (socket && !socket.connected) {
      // Wait for connection, then join user room
      socket.on("connect", () => {
        console.log("Connected to server");
        socket.emit("join", user._id);
      });
    } else if (socket?.connected) {
      // Already connected, just join the room
      socket.emit("join", user._id);
    }

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      // Keep socket alive but remove specific listeners
    };
  }, [user?._id]);

  // Set up message listeners - updated when chatWith or user changes
  useEffect(() => {
    if (!socket) return;

    // Listen for real-time messages
    const handleReceiveMessage = (msg) => {
      if (
        (msg.sender === chatWith._id && msg.receiver === user._id) ||
        (msg.sender === user._id && msg.receiver === chatWith._id)
      ) {
        addMessage(msg);
      }
    };

    // Listen for message notifications
    const handleMessageNotification = (notif) => {
      setNotification({
        type: "message",
        from: notif.senderName,
        message: notif.message
      });
      setTimeout(() => setNotification(null), 3000);
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageNotification", handleMessageNotification);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageNotification", handleMessageNotification);
    };
  }, [chatWith._id, user._id, addMessage]);

  // Set up online status listeners - updated when chatWith changes
  useEffect(() => {
    if (!socket) return;

    // Listen for online/offline status updates
    const handleUserOnline = (data) => {
      if (data.userId === chatWith._id) {
        setRecipientOnline(true);
        showNotification(`${chatWith.name} is now online`, "online");
      }
    };

    const handleUserOffline = (data) => {
      if (data.userId === chatWith._id) {
        setRecipientOnline(false);
        showNotification(`${chatWith.name} went offline`, "offline");
      }
    };

    const handleOnlineUsersList = (onlineUserIds) => {
      setRecipientOnline(onlineUserIds.includes(chatWith._id));
      updateOnlineUsers(onlineUserIds);
    };

    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);
    socket.on("onlineUsersList", handleOnlineUsersList);

    return () => {
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
      socket.off("onlineUsersList", handleOnlineUsersList);
    };
  }, [chatWith._id, chatWith.name, updateOnlineUsers]);

  // Show notification popup
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  };
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  // Send message with validation
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    setIsSending(true);
    try {
      const { data: response } = await axios.post("/chat", {
        receiverId: chatWith._id,
        content: text.trim()
      });

      const newMessage = response.data;

      // Emit to socket for real-time delivery to recipient
      if (socket && socket.connected) {
        socket.emit("sendMessage", {
          sender: user._id,
          senderName: user.name,
          receiver: chatWith._id,
          content: text.trim(),
          _id: newMessage._id,
          createdAt: newMessage.createdAt
        });
      }
      addMessage(newMessage);
      
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
      showNotification("Failed to send message", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chat-window">
      {/* Notification Popup */}
      {notification && (
        <div className={`notification notification-${notification.type || 'message'}`}>
          {notification.from 
            ? `${notification.from}: ${notification.message}` 
            : notification.message}
        </div>
      )}

      {/* Chat Header */}
      <div className="chat-header">
        <div>
          <h3>{chatWith?.name}</h3>
          <div className="chat-header-info">
            <span className={`online-status ${recipientOnline ? "online" : "offline"}`}></span>
            <span>{recipientOnline ? "Online" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {loading ? (
          <div className="loading">Loading chat history...</div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#e74c3c', 
            margin: 'auto',
            padding: '20px'
          }}>
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            💬 No messages yet. Start the conversation by sending the first message!
          </div>
        ) : (
          messages.map((m) => (
            <div 
              key={m._id} 
              className={`message ${
                m.sender._id === user._id ? "sender" : "receiver"
              }`}
            >
              <div className="message-content">{m.content}</div>
              <div className="message-time">
                {new Date(m.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput onSend={sendMessage} disabled={isSending} />
    </div>
  );
}
