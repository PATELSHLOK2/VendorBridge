import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { showToast } from "../services/api.js";
import { Mail, User, Send, ArrowLeft, Camera } from "lucide-react";

export default function Register({ onSwitchToLogin }) {
  const { sendOTP, register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [devOtpCode, setDevOtpCode] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  const [formData, setFormData] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    additionalInfo: "",
    otpCode: "",
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }
    if (formData.password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    try {
      const res = await sendOTP(formData.email);
      if (res?.otpCode) {
        setDevOtpCode(res.otpCode);
        setFormData((prev) => ({ ...prev, otpCode: res.otpCode }));
      }
      showToast("Verification OTP sent to your email!", "success");
      setStep(2);
    } catch (err) {
      showToast(err.message || "Failed to send OTP", "error");
      console.error(err);
    }
  };

  const handleCompleteRegister = async (e) => {
    e.preventDefault();
    try {
      await register({ ...formData, image: profileImage });
      showToast("Registration completed successfully!", "success");
      if (onSwitchToLogin) {
        onSwitchToLogin();
      } else {
        navigate("/login");
      }
    } catch (err) {
      showToast(err.message || "Registration failed", "error");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Profile Photo Uploader (Exact UI matching screenshot) */}
        <div className="flex flex-col items-center justify-center">
          <label className="relative cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <div className="w-24 h-24 rounded-full bg-white border-2 border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-slate-400 group-hover:border-blue-500 group-hover:text-blue-600 transition-all overflow-hidden relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center mb-0.5 group-hover:border-blue-500">
                    <User className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-blue-600">
                    Photo
                  </span>
                </>
              )}
            </div>
          </label>
          <span className="text-xs font-medium text-slate-400 mt-2 text-center">
            Click to upload profile photo
          </span>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Create Account
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Register for VendorBridge Vendor Management System access
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* COMPANY NAME */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  COMPANY NAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tech Supplies Pvt Ltd"
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none transition-all"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </div>

              {/* FIRST NAME & LAST NAME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    FIRST NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none transition-all"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    LAST NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none transition-all"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* EMAIL & PHONE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    EMAIL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none transition-all"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    PHONE
                  </label>
                  <input
                    type="text"
                    placeholder="Phone Number"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* COUNTRY */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  COUNTRY
                </label>
                <input
                  type="text"
                  placeholder="Country"
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none transition-all"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                />
              </div>

              {/* PASSWORD & CONFIRM PASSWORD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    PASSWORD <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none transition-all"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    CONFIRM PASSWORD <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none transition-all"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* ADDITIONAL INFORMATION */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  ADDITIONAL INFORMATION
                </label>
                <textarea
                  rows="3"
                  placeholder="Tell us about your business..."
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:outline-none transition-all"
                  value={formData.additionalInfo}
                  onChange={(e) =>
                    setFormData({ ...formData, additionalInfo: e.target.value })
                  }
                ></textarea>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 text-sm mt-6"
              >
                <Mail className="w-4 h-4" />
                <span>Send Verification OTP</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleCompleteRegister} className="space-y-5">
              <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 text-center">
                <p className="text-xs text-slate-600">
                  Verification OTP dispatched to <strong>{formData.email}</strong>.
                </p>
                {devOtpCode && (
                  <div className="mt-2 text-xs text-blue-700 font-semibold bg-white rounded-xl py-1.5 px-3 border border-blue-200 inline-block shadow-xs">
                    Dev Verification Code: <span className="font-mono text-sm tracking-wider text-blue-900 font-bold">{devOtpCode}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 text-center">
                  ENTER 6-DIGIT OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xl font-bold tracking-widest text-center text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  value={formData.otpCode}
                  onChange={(e) =>
                    setFormData({ ...formData, otpCode: e.target.value })
                  }
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 text-xs transition-all"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          )}

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs font-medium text-slate-500">
            Already have an account?{" "}
            {onSwitchToLogin ? (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign in
              </button>
            ) : (
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
