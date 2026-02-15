import React, { useEffect, useState, useRef, useContext } from "react";
import { initSocket, getSocket } from "../../socket/socket";
import MessageInput from "./MessageInput";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import axios from "../../api/axios";

export default function ChatWindow({ chatWith }) {
  const { user } = useContext(AuthContext);
  const { messages, setMessagesForChat, addMessage, replaceOptimisticMessage, removeOptimisticMessage, updateOnlineUsers } =
    useContext(ChatContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [notification, setNotification] = useState(null);
  const messagesEndRef = useRef(null);
  const tempMessageIdsRef = useRef(new Set()); 
  // FETCH CHAT HISTORY
  useEffect(() => {
    if (!chatWith?._id) return;

    async function fetchChatHistory() {
      try {
        setLoading(true);
        setError(null);

        console.log(`📥 Fetching chat history with user: ${chatWith._id}`);
        const { data: response } = await axios.get(`/chat/${chatWith._id}`);
        console.log("Response received:", response);
        console.log("Messages data:", response.data);
        
        if (Array.isArray(response.data)) {
          console.log(`✓ Loaded ${response.data.length} messages`);
          setMessagesForChat(response.data);
        } else {
          console.error("response.data is not an array:", response.data);
          setMessagesForChat([]);
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
        setError("Failed to load chat history");
        setMessagesForChat([]);
      } finally {
        setLoading(false);
      }
    }

    fetchChatHistory();
  }, [chatWith?._id, setMessagesForChat]);

  // SOCKET CONNECTION INIT
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || !user?._id) return;

    const socket = initSocket(token);

    const handleConnect = () => {
      console.log("Connected to server");
      socket.emit("join", user._id);
    };

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error);
    };

    const handleDisconnect = () => {
      console.log("Disconnected from server");
    };

    if (socket && !socket.connected) {
      socket.on("connect", handleConnect);
    } else if (socket?.connected) {
      socket.emit("join", user._id);
    }

    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
    };
  }, [user?._id]);

  //REAL TIME MSG LISTENER
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !chatWith?._id || !user?._id) return;

    const handleReceiveMessage = (msg) => {
      console.log("📨 Message received via socket:", msg);
      
      // Check if this is for current chat
      const isForCurrentChat = (
        (msg.sender._id === chatWith._id && msg.receiver._id === user._id) ||
        (msg.sender._id === user._id && msg.receiver._id === chatWith._id)
      );

      if (!isForCurrentChat) {
        console.log("✗ Message is not for current chat");
        return;
      }

      console.log("✓ Message is for current chat");

      // Check if this is a message we just sent (optimistic update already in UI)
      const hasPendingMessage = messages.some(m => 
        m.tempId && 
        m.sender._id === msg.sender._id &&
        m.receiver._id === msg.receiver._id &&
        m.content === msg.content
      );

      if (hasPendingMessage) {
        console.log("✓ This is our sent message, replacing optimistic with real data");
        // Find and replace the optimistic message
        const tempId = messages.find(m => 
          m.tempId && 
          m.sender._id === msg.sender._id &&
          m.receiver._id === msg.receiver._id &&
          m.content === msg.content
        )?.tempId;
        
        if (tempId) {
          tempMessageIdsRef.current.delete(tempId);
          replaceOptimisticMessage(tempId, msg);
        }
      } else {
        // This is a new message from recipient
        console.log("✓ New message from recipient, adding...");
        addMessage(msg);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [chatWith?._id, user?._id, addMessage, replaceOptimisticMessage, messages]);

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

    console.log(`📤 Sending message to ${chatWith.name}:`, text);
    setIsSending(true);

    //  OPTIMISTIC UPDATE: Add message IMMEDIATELY to UI
    const tempId = `temp_${Date.now()}_${Math.random()}`;
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
    tempMessageIdsRef.current.add(tempId);
    addMessage(optimisticMessage);

    try {
      // 2️⃣ Send to backend
      const response = await axios.post("/chat", {
        receiverId: chatWith._id,
        content: text.trim(),
      });

      console.log("Message sent successfully:", response.data.data);

      // 3️⃣ UPDATE optimistic message with real server data
      const serverMessage = response.data.data;
      tempMessageIdsRef.current.delete(tempId);
      replaceOptimisticMessage(tempId, serverMessage);

      showNotification("Message sent", "success");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
      showNotification("Failed to send message", "error");
      
      // Remove failed optimistic message
      tempMessageIdsRef.current.delete(tempId);
      removeOptimisticMessage(tempId);
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
