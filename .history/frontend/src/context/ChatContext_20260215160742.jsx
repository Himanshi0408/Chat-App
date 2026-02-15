import { createContext, useState, useCallback } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const addMessage = useCallback((message) => {
    setMessages(prev => {
      // Check if message already exists by _id to prevent duplicates
      if (prev.some(m => m._id === message._id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const setMessagesForChat = useCallback((newMessages) => {
    if (!Array.isArray(newMessages)) {
      setMessages([]);
      return;
    }
    
    // Deduplicate by _id - keep only unique messages
    const messageMap = new Map();
    newMessages.forEach(msg => {
      messageMap.set(msg._id, msg);
    });
    
    setMessages(Array.from(messageMap.values()));
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
