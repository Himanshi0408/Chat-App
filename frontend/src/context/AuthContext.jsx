import { createContext, useState, useEffect } from "react";
import { disconnectSocket, initSocket, getSocket } from "../socket/socket";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  //  SAFA PARSING
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        return JSON.parse(storedUser);
      }
      return null;
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
      localStorage.removeItem("user"); 
      return null;
    }
  });

  const login = (userData, token) => {
    // store user & token
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("authToken", token);
    setUser(userData);
  };

  // Initialize socket when user is present (so app-level listeners work)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (user && token) {
      try {
        const socket = initSocket(token);
        socket.on("connect", () => {
          if (user && user._id) {
            socket.emit("join", user._id);
          }
        });
      } catch (err) {
        console.error("Failed to init socket in AuthProvider:", err);
      }
    }
  }, [user]);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    disconnectSocket(); 
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
