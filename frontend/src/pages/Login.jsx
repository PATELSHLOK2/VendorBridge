import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { showToast } from "../services/api.js";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2 } from "lucide-react";
import Register from "./Register.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isRegisterView, setIsRegisterView] = useState(false);
  const [email, setEmail] = useState("admin@vendorbridge.com");
  const [password, setPassword] = useState("123");
  const [showPassword, setShowPassword] = useState(false);

  const handleQuickLogin = async (presetEmail) => {
    try {
      setEmail(presetEmail);
      setPassword("123");
      await login(presetEmail, "123");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  if (isRegisterView) {
    return <Register onSwitchToLogin={() => setIsRegisterView(false)} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
      <div className="w-full max-w-md">
        {/* Top Circular Brand Avatar */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-100/80 border-2 border-blue-200 flex items-center justify-center text-blue-600 mx-auto mb-3 shadow-md shadow-blue-500/10">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">VendorBridge</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Sign in to Vendor Management System</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 mb-6">
          <form onSubmit={handleSubmitLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">USERNAME OR EMAIL</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="admin, officer, manager, vendor..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">PASSWORD</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 text-sm"
            >
              <span>Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* DEMO CREDENTIALS Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block text-center mb-3">DEMO CREDENTIALS</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@vendorbridge.com")}
                className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Shlok</div>
                <div className="text-[11px] font-medium text-slate-400">Admin · admin / 123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("officer@vendorbridge.com")}
                className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Harshil</div>
                <div className="text-[11px] font-medium text-slate-400">Officer · officer / 123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("manager@vendorbridge.com")}
                className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Krish</div>
                <div className="text-[11px] font-medium text-slate-400">Manager · manager / 123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("vendor@techsupplies.com")}
                className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 rounded-xl text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Jay</div>
                <div className="text-[11px] font-medium text-slate-400">Vendor · vendor / 123</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs font-medium text-slate-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setIsRegisterView(true)}
              className="text-blue-600 font-semibold hover:underline"
            >
              Register here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
