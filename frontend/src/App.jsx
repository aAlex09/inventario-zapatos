import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivateRoute from "./routes/PrivateRoute";
import { setupAutoLogout } from "./utils/sessionManager";

function App() { 
  // Set up auto logout on component mount
  useEffect(() => {
    // Setup handler for tab/window close
    const cleanupAutoLogout = setupAutoLogout();
    
    // Cleanup function to remove event listener when component unmounts
    return () => {
      cleanupAutoLogout();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/users" element={
          <PrivateRoute>
            <UsersPage />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
