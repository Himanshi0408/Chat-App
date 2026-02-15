vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
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
