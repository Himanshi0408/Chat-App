import React from "react";

export default function OnlineStatus({ isOnline }) {
  return <span className={`online-status ${isOnline ? "online" : "offline"}`}></span>;
}
