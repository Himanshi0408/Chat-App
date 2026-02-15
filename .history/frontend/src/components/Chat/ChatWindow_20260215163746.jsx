import React, { useEffect, useState, useRef, useContext } from "react";
import { initSocket, getSocket } from "../../socket/socket";
import MessageInput from "./MessageInput";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import axios from "../../api/axios";

export default function ChatWindow({ chatWith }) {
  const { user } = useContext(AuthContext);
  const {
    messages,
    setMessagesForChat,
    addMessage,
    updateOnlineUsers,
  } = useContext(ChatContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [recipientOnline, setRecipientOnline] = useState(false);
  const [notification, setNotification] = useState(null);
  const messagesEndRef = useRef(null);

  /* ============================= */
  /* FETCH CHAT HISTORY (PERSIST)  */
  /* ============================= */
  useEffect(() => {
    if (!chatWith?._id) return;

    async function fetchChatHistory() {
      try {
        setLoading(true);
        setError(null);

        const { data } = await axios.get(`/chat/${chatWith._id}`);
        setMessagesForChat(data || []);
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

  /* ============================= */
  /* SOCKET CONNECTION INIT        */
  /* ============================= */
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

  /* ============================= */
  /* REAL-TIME MESSAGE LISTENER    */
  /* ============================= */
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !chatWith?._id || !user?._id) return;

    const handleReceiveMessage = (msg) => {
      if (
        (msg.sender._id === chatWith._id &&
          msg.receiver._id === user._id) ||
        (msg.sender._id === user._id &&
          msg.receiver._id === chatWith._id)
      ) {
        addMessage(msg);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [chatWith?._id, user?._id, addMessage]);

  
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
// SEND MSGS
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    setIsSending(true);
    try {
      await axios.post("/chat", {
        receiverId: chatWith._id,
        content: text.trim(),
      });

      // Backend controller handles real-time emit
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
      showNotification("Failed to send message", "error");
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
          <div style={{ textAlign: "center", color: "#e74c3c" }}>
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
             No messages yet. Start the conversation!
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
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
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
