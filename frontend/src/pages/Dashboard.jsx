import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { formatCurrency, formatDate } from "../services/utils.js";
import {
  FileText,
  CheckSquare,
  Users,
  TrendingUp,
  RefreshCw,
  Plus,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  Building2,
  Activity,
  Clock,
  ArrowUpRight,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, rfqRes] = await Promise.all([
        api.get("/api/reports/dashboard"),
        api.get("/api/rfqs"),
      ]);
      setKpis(kpiRes.data || {});
      setRfqs(rfqRes.data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Welcome back, {user.firstName} {user.lastName} — {user.role === "ADMIN" ? "Admin's Overview" : "Procurement Overview"}
          </p>
        </div>
        <div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ACTIVE RFQS</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              {loading ? "—" : kpis?.activeRFQs ?? 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PENDING APPROVALS</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              {loading ? "—" : kpis?.pendingApprovals ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-400 mt-1 block">
              {kpis?.pendingApprovals === 0 ? "All clear" : "Requires manager review"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ACTIVE VENDORS</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              {loading ? "—" : kpis?.vendorCount ?? 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL SPEND</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
              {loading ? "—" : formatCurrency(kpis?.totalSpend ?? 0)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Section: Recent Orders & Spending Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-900">Recent Purchase Orders</h2>
            </div>
            <Link to="/purchase-orders" className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-48">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-400">No purchase orders yet</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900">Spending Trends</h2>
          </div>
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-48">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-400">No spend data yet</span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS Toolbar Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-4">QUICK ACTIONS</span>
        <div className="flex flex-wrap gap-3">
          {user.role !== "VENDOR" && (
            <Link
              to="/rfqs"
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 text-blue-700 text-xs font-semibold rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create RFQ</span>
            </Link>
          )}
          <Link
            to="/quotations"
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Compare Quotations</span>
          </Link>
          <Link
            to="/purchase-orders"
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-slate-500" />
            <span>Purchase Orders</span>
          </Link>
          <Link
            to="/invoices"
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <CreditCard className="w-4 h-4 text-slate-500" />
            <span>Invoices</span>
          </Link>
          {user.role !== "VENDOR" && (
            <Link
              to="/vendors"
              className="flex items-center space-x-2 px-4 py-2.5 bg-purple-50/80 hover:bg-purple-100/80 border border-purple-200/60 text-purple-700 text-xs font-semibold rounded-xl transition-all"
            >
              <Building2 className="w-4 h-4" />
              <span>Approve Vendors</span>
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link
              to="/activity"
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              <Activity className="w-4 h-4 text-slate-500" />
              <span>Activity Logs</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
