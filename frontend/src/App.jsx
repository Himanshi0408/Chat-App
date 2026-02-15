import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./pages/Dashboard";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            } />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

function RequireAuth({ children }) {
  const { user } = React.useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default App;
