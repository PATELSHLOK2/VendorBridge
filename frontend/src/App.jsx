import React, { useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import {
  LayoutDashboard,
  Users as UsersIcon,
  Building2,
  FileText,
  MessageSquare,
  CheckSquare,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Activity,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Vendors from "./pages/Vendors.jsx";
import RFQs from "./pages/RFQs.jsx";
import Quotations from "./pages/Quotations.jsx";
import Approvals from "./pages/Approvals.jsx";
import PurchaseOrders from "./pages/PurchaseOrders.jsx";
import Invoices from "./pages/Invoices.jsx";
import Reports from "./pages/Reports.jsx";
import ActivityLogs from "./pages/ActivityLogs.jsx";

function ProtectedLayout() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 font-medium">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading VendorBridge...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;
  const roleDisplay =
    role === "ADMIN"
      ? "Administrator"
      : role === "PROCUREMENT_OFFICER"
      ? "Procurement Officer"
      : role === "MANAGER"
      ? "Manager"
      : "Supplier / Vendor";

  const menuItems = [
    { path: "/dashboard",       label: "Dashboard",       icon: LayoutDashboard, roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] },
    { path: "/users",           label: "Users",           icon: UsersIcon,       roles: ["ADMIN"] },
    { path: "/vendors",         label: "Vendors",         icon: Building2,       roles: ["ADMIN", "PROCUREMENT_OFFICER"] },
    { path: "/rfqs",            label: "RFQs",            icon: FileText,        roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"] },
    { path: "/quotations",      label: "Quotations",      icon: MessageSquare,   roles: ["ADMIN", "PROCUREMENT_OFFICER", "VENDOR"] },
    { path: "/approvals",       label: "Approvals",       icon: CheckSquare,     roles: ["ADMIN", "MANAGER"] },
    { path: "/purchase-orders", label: "Purchase Orders", icon: ShoppingBag,     roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] },
    { path: "/invoices",        label: "Invoices",        icon: CreditCard,      roles: ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] },
    { path: "/reports",         label: "Reports",         icon: BarChart3,       roles: ["ADMIN", "MANAGER"] },
    { path: "/activity",        label: "Activity Logs",   icon: Activity,        roles: ["ADMIN"] },
  ];

  const allowedNav = menuItems.filter((item) => item.roles.includes(role));

  const initials = `${user.firstName?.[0] || 'S'}${user.lastName?.[0] || 'A'}`.toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Left Sidebar Shell */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col fixed inset-y-0 left-0 z-40 shadow-sm">
        {/* Sidebar Brand Header */}
        <div className="p-5 flex items-center space-x-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-900 tracking-tight block leading-tight">VendorBridge</span>
            <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">VENDOR MANAGEMENT SYSTEM</span>
          </div>
        </div>

        {/* Role Pill Badge */}
        <div className="px-5 pt-4 pb-2">
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100 inline-block">
            {roleDisplay}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom WORKFLOW Card */}
        <div className="p-4 m-3 bg-slate-50/80 rounded-2xl border border-slate-200/60">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-2">YOUR WORKFLOW</span>
          <ul className="space-y-1.5 text-[11px] font-medium text-slate-600">
            <li className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px]">1</span>
              <span className="truncate">Manage all users</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px]">2</span>
              <span className="truncate">Approve vendor registrations</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[9px]">3</span>
              <span className="truncate">Full procurement access</span>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={logout}
            className="flex items-center justify-center space-x-2 w-full px-3 py-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Right Content */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-8 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold text-slate-900 tracking-tight">{user.firstName} {user.lastName}</span>
          </div>
          <div className="flex items-center space-x-4 relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer ring-2 ring-blue-600/20 focus:outline-none"
              title="Click to view profile"
            >
              {initials}
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 top-12 w-72 bg-white rounded-3xl border border-slate-200/80 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 border-b border-slate-100 flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-500/20">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-sm text-slate-900 truncate block">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-xs text-slate-500 truncate block">
                        {user.email}
                      </span>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                        {roleDisplay}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs font-medium text-slate-600 border-b border-slate-100">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Account Role</span>
                      <span className="font-bold text-slate-800">{user.role}</span>
                    </div>
                    {user.phone && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Phone</span>
                        <span className="font-semibold text-slate-700">{user.phone}</span>
                      </div>
                    )}
                    {user.country && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Country</span>
                        <span className="font-semibold text-slate-700">{user.country}</span>
                      </div>
                    )}
                </div>
              </div>
            </>
          )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 flex-1 bg-slate-50/50">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/rfqs" element={<RFQs />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/activity" element={<ActivityLogs />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 font-medium">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading VendorBridge...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}
