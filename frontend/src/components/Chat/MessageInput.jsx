import React, { useState } from "react";

export default function MessageInput({ onSend, disabled = false }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    
    onSend(text);
    setText(""); // Clear input after sending
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input">
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={disabled}
        maxLength={1000}
      />
      <button 
        onClick={handleSend} 
        disabled={!text.trim() || disabled}
        title={disabled ? "Sending..." : "Send message (Enter)"}
      >
        {disabled ? "📤" : "📤"} Send
      </button>
    </div>
  );
}
