import React, { useState, useContext, useEffect } from "react";
import ChatList from "../components/Chat/ChatList";
import ChatWindow from "../components/Chat/ChatWindow";
import UserProfile from "../components/Chat/UserProfile";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import "../styles/chat.css";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { activeChat, setActiveChat } = useContext(ChatContext);
  const [selectedChat, setSelectedChat] = useState(null);

  // Sync active chat with selected chat
  useEffect(() => {
    if (activeChat) {
      setSelectedChat(activeChat);
    }
  }, [activeChat]);

  const handleSelectChat = (chatUser) => {
    setSelectedChat(chatUser);
    setActiveChat(chatUser);
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <UserProfile user={user} />
        <ChatList onSelectChat={handleSelectChat} />
      </div>
      <div className="chat-area">
        {selectedChat ? (
          <ChatWindow chatWith={selectedChat} />
        ) : (
          <div className="no-chat">
            👋 Select a user from the list to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
