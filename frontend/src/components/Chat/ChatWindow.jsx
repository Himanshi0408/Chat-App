import React, { useEffect, useState, useRef, useContext } from "react";
import { initSocket, getSocket } from "../../socket/socket";
import MessageInput from "./MessageInput";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import axios from "../../api/axios";

export default function ChatWindow({ chatWith }) {
  const { user } = useContext(AuthContext);
  const { messages: contextMessages, setMessagesForChat, updateOnlineUsers } =
    useContext(ChatContext);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [notification, setNotification] = useState(null);
  const messagesEndRef = useRef(null); 
  // FETCH CHAT HISTORY
  useEffect(() => {
    if (!chatWith?._id) return;

    async function fetchChatHistory() {
      try {
        setLoading(true);
        setError(null);

        // Loading chat history
        const { data: response } = await axios.get(`/chat/${chatWith._id}`);
        
        if (Array.isArray(response.data)) {
          // Loaded messages
          setMessages(response.data);
        } else {
          console.error("❌ Invalid response:", response.data);
          setMessages([]);
        }
      } catch (err) {
        console.error("❌ Failed to load chat:", err.message);
        setError("Failed to load chat");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    }

    fetchChatHistory();
  }, [chatWith?._id]);

  // SOCKET CONNECTION INIT
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || !user?._id) return;

    const socket = initSocket(token);

    const handleConnect = () => {
      socket.emit("join", user._id);
    };

    if (socket && !socket.connected) {
      socket.on("connect", handleConnect);
    } else if (socket?.connected) {
      socket.emit("join", user._id);
    }

    socket.on("connect_error", (error) => {
      console.error("🔴 Socket error:", error.message);
    });

    // NOTIFICATION LISTENER - Listen for messages when user not in chat
    const handleNewNotification = (notification) => {
      // Show notification toast
      showNotification(
        `New message from ${notification.from.name}: "${notification.messagePreview}"`,
        "message"
      );
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error");
      socket.off("newNotification", handleNewNotification);
    };
  }, [user?._id]);

  // JOIN CHAT ROOM WHEN CHAT CHANGES
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !chatWith?._id || !user?._id) {
      console.warn("⚠️ Not ready to join chat room");
      return;
    }

    const chatRoomId = [user._id, chatWith._id].sort().join("_");
    
    socket.emit("joinChatRoom", chatRoomId);
  }, [chatWith?._id, user?._id]);

  //REAL TIME MSG LISTENER
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.error("❌ Socket not initialized");
      return;
    }
    if (!chatWith?._id || !user?._id) {
      console.warn("⚠️ Chat or user not ready");
      return;
    }

    // Setting up message listener for current chat

    const handleReceiveMessage = (msg) => {
      // Received message event
      
      // Check if message is for current chat
      const isRelevant = (
        (msg.sender._id === chatWith._id && msg.receiver._id === user._id) ||
        (msg.sender._id === user._id && msg.receiver._id === chatWith._id)
      );

      if (!isRelevant) return;

      // Update messages with smart duplicate detection
      setMessages(prev => {
        // Check if message already exists (by real ID or optimistic ID)
        const isDuplicate = prev.some(m => 
          m._id === msg._id || 
          (m.tempId && m.content === msg.content && m.sender._id === msg.sender._id)
        );
        
        if (isDuplicate) {
          // Replace optimistic with real
          return prev.map(m => 
            (m.tempId && m.content === msg.content && m.sender._id === msg.sender._id) 
              ? msg 
              : m
          );
        } else {
          // New message from recipient
          return [...prev, msg];
        }
      });
    };

    // Register listener
    socket.on("receiveMessage", handleReceiveMessage);

    // Cleanup
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [chatWith?._id, user?._id]);

  // STATUS LISTENER
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !chatWith?._id) return;

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
  }, [chatWith?._id, chatWith?.name, updateOnlineUsers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // SEND MSGS - OPTIMISTIC UPDATE
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    // Sending message 

    setIsSending(true);

    // Create optimistic message 
    const optimisticMessage = {
      tempId,
      _id: tempId,
      sender: {
        _id: user._id,
        name: user.name,
        profilePic: user.profilePic || ""
      },
      receiver: {
        _id: chatWith._id,
        name: chatWith.name,
        profilePic: chatWith.profilePic || ""
      },
      content: text.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sending: true
    };

    // Add to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send to backend
      const response = await axios.post("/chat", {
        receiverId: chatWith._id,
        content: text.trim(),
      });

      const serverMessage = response.data.data;
      
      // Server response received, replacing optimistic message
      
      setMessages(prev => 
        prev.map(m => m.tempId === tempId ? serverMessage : m)
      );
      // Replaced optimistic message
    } catch (err) {
      console.error(" Send failed:", err.message);
      setError("Message failed to send");
      // Remove failed message
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  };

  // UI RENDER
  return (
    <div className="chat-window">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="chat-header">
        <div>
          <h3>{chatWith?.name}</h3>
          <div className="chat-header-info">
            <span
              className={`online-status ${
                recipientOnline ? "online" : "offline"
              }`}
            ></span>
            <span>{recipientOnline ? "Online" : "Offline"}</span>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="loading">Loading chat history...</div>
        ) : error ? (
          <div style={{ textAlign: "center", color: "#e74c3c" }}>{error}</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m._id || m.tempId}
              className={`message ${
                m.sender._id === user._id ? "sender" : "receiver"
              } ${m.sending ? "sending" : ""}`}
              style={m.sending ? { opacity: 0.7 } : {}}
            >
              <div className="message-content">{m.content}</div>
              <div className="message-time">
                {m.sending && <span style={{ marginRight: "4px" }}>⏳</span>}
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
                {m.sender._id === user._id && !m.sending && <span style={{ marginLeft: "4px" }}>✓</span>}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={sendMessage} disabled={isSending} />
    </div>
  );
}
