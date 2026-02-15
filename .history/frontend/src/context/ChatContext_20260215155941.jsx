import { createContext, useState, useCallback } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const addMessage = useCallback((message) => {
    setMessages(prev => {
      // Check if message already exists by _id to prevent duplicates
      const messageExists = prev.some(m => m._id === message._id);
      if (messageExists) {
        return prev; // Don't add duplicate
      }
      return [...prev, message];
    });
  }, []);

  const setMessagesForChat = useCallback((newMessages) => {
    // Deduplicate messages by _id
    const uniqueMessages = [];
    const messageIds = new Set();
    
    newMessages.forEach(msg => {
      if (!messageIds.has(msg._id)) {
        uniqueMessages.push(msg);
        messageIds.add(msg._id);
      }
    });
    
    setMessages(uniqueMessages);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const updateOnlineUsers = useCallback((users) => {
    setOnlineUsers(new Set(users));
  }, []);

  return (
    <ChatContext.Provider 
      value={{ 
        activeChat, 
        setActiveChat, 
        messages, 
        addMessage, 
        setMessagesForChat,
        clearMessages,
        onlineUsers,
        updateOnlineUsers
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
