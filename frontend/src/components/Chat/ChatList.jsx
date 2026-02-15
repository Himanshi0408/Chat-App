import React, { useEffect, useState, useContext } from "react";
import io from "socket.io-client";
import axios from "../../api/axios";
import { ChatContext } from "../../context/ChatContext";

let socket = null;

export default function ChatList({ onSelectChat }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { activeChat } = useContext(ChatContext);

  // Fetch all users on component mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const { data: response } = await axios.get("/users");

        // Extract users from response { statusCode, message, data: users }
        const users = response.data || [];

        // Safe parsing of current user from localStorage
        const currentUserRaw = localStorage.getItem("user");
        let currentUser = null;
        if (currentUserRaw && currentUserRaw !== "undefined" && currentUserRaw !== "null") {
          currentUser = JSON.parse(currentUserRaw);
        }

        // Filter out current user
        if (currentUser) {
          setUsers(users.filter(u => u._id !== currentUser._id));
        } else {
          setUsers(users);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load users. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Fetch online users from API and listen to Socket.io events
  useEffect(() => {
    // Fetch online users from API
    async function fetchOnlineUsers() {
      try {
        const { data: response } = await axios.get("/users/online");
        const onlineUsersList = response.data || [];
        const onlineUserIds = new Set(onlineUsersList.map(u => u._id));
        setOnlineUsers(onlineUserIds);
      } catch (err) {
        console.error("Failed to fetch online users:", err);
      }
    }

    fetchOnlineUsers();

    // Connect to Socket.io for real-time updates
    if (!socket) {
      socket = io("http://localhost:5000", {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      // Listen for user online status
      socket.on("userOnline", (data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      });

      // Listen for user offline status
      socket.on("userOffline", (data) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
      });

      // Listen for online users list update
      socket.on("onlineUsersList", (onlineUserIds) => {
        setOnlineUsers(new Set(onlineUserIds));
      });
    }

    return () => {
      // Keep socket alive for other components
    };
  }, []);

  // Generate avatar initials
  const getAvatarInitials = (name) => {
    return name
      ?.split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  if (loading) {
    return (
      <div className="chat-list">
        <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
          <div className="loading">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-list">
        <div style={{ 
          padding: "20px", 
          textAlign: "center", 
          color: "#e74c3c",
          fontSize: "13px"
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list">
      {users.length === 0 ? (
        <p>No users available</p>
      ) : (
        users.map(user => (
          <div
            key={user._id}
            className={`chat-user ${activeChat?._id === user._id ? "active" : ""}`}
            onClick={() => onSelectChat(user)}
            title={user.name}
          >
            <div className="chat-user-avatar">
              {getAvatarInitials(user.name)}
              <span className={`online-indicator ${onlineUsers.has(user._id) ? "online" : "offline"}`}></span>
            </div>
            <div className="chat-user-info">
              <div className="chat-user-name">{user.name}</div>
              <div className="chat-user-status">
                {onlineUsers.has(user._id) ? (
                  <span className="status-online"> Online</span>
                ) : (
                  <span className="status-offline"> Offline</span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
