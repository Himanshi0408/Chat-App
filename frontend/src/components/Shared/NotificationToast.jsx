import React, { useEffect, useState, useContext } from "react";
import { getSocket } from "../../socket/socket";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/chat.css";

export default function NotificationToast() {
  const { user } = useContext(AuthContext);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleNewNotification = (payload) => {
      const preview = payload.messagePreview || "New message";
      setNotification({ message: `${payload.from.name}: ${preview}`, type: "message" });
      setTimeout(() => setNotification(null), 3000);
    };

    socket.on("newNotification", handleNewNotification);
    return () => socket.off("newNotification", handleNewNotification);
  }, [user]);

  if (!notification) return null;

  return (
    <div className={`notification notification-message`}>
      {notification.message}
    </div>
  );
}
