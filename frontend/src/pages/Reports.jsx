import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api, showToast } from "../services/api.js";
import { formatCurrency } from "../services/utils.js";
import {
  CreditCard,
  Building2,
  BarChart3,
  Clock,
  Download,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#2563eb", "#059669", "#7c3aed", "#d97706", "#dc2626", "#0891b2"];

export default function Reports() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [categories, setCategories] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [kpiRes, categoryRes, topVendorsRes] = await Promise.all([
        api.get("/api/reports/kpis"),
        api.get("/api/reports/spend-by-category"),
        api.get("/api/reports/top-vendors"),
      ]);
      setKpis(kpiRes.data || {});
      setCategories(categoryRes.data || []);
      setTopVendors(topVendorsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      showToast("Preparing CSV report...", "info");
      const token = api.getToken();
      const response = await fetch("/api/reports/export?format=csv", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const csvText = await response.text();
      const blob = new Blob([csvText], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vendorbridge-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Report exported successfully", "success");
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header Bar (Page 15 of PDF) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Insightful procurement performance and spend analysis</p>
        </div>
        <div>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Spend CSV</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards (Page 15 of PDF) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ACCUMULATED SPEND</span>
          <span className="text-3xl font-extrabold text-blue-600 mt-1 block">
            {loading ? "—" : formatCurrency(kpis?.totalSpend ?? 0)}
          </span>
          <span className="text-xs font-medium text-slate-400 mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 inline" />
            <span>Active budget invoices</span>
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ACTIVE SUPPLIERS</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
            {loading ? "—" : kpis?.activeVendors ?? 0}
          </span>
          <span className="text-xs font-medium text-slate-400 mt-1 flex items-center space-x-1">
            <Building2 className="w-3.5 h-3.5 text-blue-500 inline" />
            <span>Registered and active</span>
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CAMPAIGNS COMPLETED</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
            {loading ? "—" : kpis?.rfqsProcessed ?? 0}
          </span>
          <span className="text-xs font-medium text-slate-400 mt-1 flex items-center space-x-1">
            <BarChart3 className="w-3.5 h-3.5 text-purple-500 inline" />
            <span>Closed RFQs</span>
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">UNRESOLVED APPROVALS</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-1 block">
            {loading ? "—" : kpis?.pendingApprovals ?? 0}
          </span>
          <span className="text-xs font-medium text-slate-400 mt-1 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-500 inline" />
            <span>Pending review</span>
          </span>
        </div>
      </div>

      {/* 2 Chart Grid Cards (Page 15 of PDF) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block mb-6">PROCUREMENT SPEND TREND</span>
          <div className="h-64 w-full flex items-center justify-center">
            {topVendors.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVendors}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="companyName" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="totalSpend" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs font-medium text-slate-400">No spend trend data available.</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block mb-6">SPEND ALLOCATION BY CATEGORY</span>
          <div className="h-64 w-full flex items-center justify-center">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ category, total }) => `${category}: $${total}`}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs font-medium text-slate-400">No category allocation data available.</span>
            )}
          </div>
        </div>
      </div>

      {/* TOP 5 VENDORS BY SPEND Section (Page 15 of PDF) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">TOP 5 VENDORS BY SPEND</span>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">VENDOR COMPANY</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">PO COUNT</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL SPEND</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan="3" className="text-center py-8 text-slate-400">Loading top vendors...</td></tr>
              ) : topVendors.length === 0 ? (
                <tr><td colSpan="3" className="text-center py-8 text-slate-400">No vendor spend data available.</td></tr>
              ) : (
                topVendors.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{v.companyName} ({v.vendorName})</td>
                    <td className="px-4 py-3 text-slate-500">{v.poCount}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(v.totalSpend)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
