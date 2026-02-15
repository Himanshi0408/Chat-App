import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ✅ SAFA PARSING
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        return JSON.parse(storedUser);
      }
      return null;
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
      localStorage.removeItem("user"); // remove broken value
      return null;
    }
  });

  const login = (userData, token) => {
    // store user & token
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("authToken", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
