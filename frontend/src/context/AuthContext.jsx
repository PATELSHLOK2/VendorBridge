import React, { createContext, useContext, useState, useEffect } from "react";
import { api, showToast } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await api.get("/api/auth/me");
      if (res.success && res.data.user) {
        setUser(res.data.user);
        setLoading(false);
        return res.data.user;
      }
    } catch {
      api.clearToken();
      setUser(null);
    }
    setLoading(false);
    return null;
  }

  async function login(email, password) {
    const res = await api.post("/api/auth/login", { email, password });
    if (res.success && res.data.token) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      showToast(`Welcome back, ${res.data.user.firstName}!`, "success");
      return res.data.user;
    }
  }

  async function sendOTP(email) {
    const res = await api.post("/api/auth/send-otp", { email });
    if (res.success) {
      showToast(res.message || "OTP code sent to email!", "success");
    }
    return res;
  }

  async function register(formData) {
    const res = await api.post("/api/auth/register", formData);
    if (res.success) {
      showToast(res.message || "Registration successful!", "success");
    }
    return res;
  }

  function logout() {
    api.clearToken();
    setUser(null);
    showToast("Logged out successfully.", "info");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        sendOTP,
        register,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
