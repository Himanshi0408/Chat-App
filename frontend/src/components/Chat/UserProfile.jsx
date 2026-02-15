import React from "react";
import OnlineStatus from "./OnlineStatus";

export default function UserProfile({ user }) {
  return (
    <div className="user-profile">
      <img src={user?.profilePic || "/default-avatar.png"} alt="Profile" />
      <h3>{user?.name} <OnlineStatus isOnline={user?.isOnline} /></h3>
      <p>{user?.email}</p>
    </div>
  );
}
