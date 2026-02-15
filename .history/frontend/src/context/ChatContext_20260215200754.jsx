import { createContext, useState, useCallback } from "react";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const addMessage = useCallback((message) => {
    console.log("Adding message to state:", message);
    setMessages(prev => {
      // For server messages, check if already exists by _id
      if (message._id) {
        const messageExists = prev.some(m => m._id === message._id);
        if (messageExists) {
          console.log("Message already exists, skipping duplicate");
          return prev;
        }
      }
      console.log("New message added. Total messages:", prev.length + 1);
      return [...prev, message];
    });
  }, []);

  // Update optimistic message with server response
  const updateMessage = useCallback((tempId, serverMessage) => {
    console.log(`Updating optimistic message ${tempId} with server data`);
    setMessages(prev => 
      prev.map(m => m.tempId === tempId ? serverMessage : m)
    );
  }, []);

  const setMessagesForChat = useCallback((newMessages) => {
    // Ensure newMessages is an array
    if (!Array.isArray(newMessages)) {
      console.error("setMessagesForChat received non-array:", newMessages);
      setMessages([]);
      return;
    }

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
        updateMessage,
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
