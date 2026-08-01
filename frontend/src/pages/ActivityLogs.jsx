import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { formatDate } from "../services/utils.js";
import { Activity, Filter } from "lucide-react";

export default function ActivityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [moduleFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const url = moduleFilter === "ALL" ? "/api/activity-logs" : `/api/activity-logs?module=${moduleFilter}`;
      const res = await api.get(url);
      const dataArr = res.data?.logs || (Array.isArray(res.data) ? res.data : []);
      setLogs(dataArr);
    } catch (err) {
      console.error("ActivityLogs error:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <div className="space-y-8">
      {/* Header Bar (Page 16 of PDF) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Activity Logs</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Audit log records of user actions and events</p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs focus:outline-none"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="ALL">All Modules</option>
            <option value="AUTH">Auth & Login</option>
            <option value="VENDOR">Vendors</option>
            <option value="RFQ">RFQs</option>
            <option value="QUOTATION">Quotations</option>
            <option value="APPROVAL">Approvals</option>
            <option value="PURCHASE_ORDER">Purchase Orders</option>
            <option value="INVOICE">Invoices</option>
          </select>
        </div>
      </div>

      {/* Main Activity Table Card (Page 16 of PDF) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">USER</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACTION</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">MODULE</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">DETAILS</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-medium">Loading audit trail logs...</td></tr>
              ) : safeLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Activity className="w-10 h-10 text-slate-300" />
                      <span className="font-medium text-xs">No activity logs recorded.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                safeLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-slate-900 block">{log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}</span>
                        <span className="text-[11px] text-slate-400 block">{log.user?.email || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600">
                      <span className="px-2 py-0.5 bg-blue-50 rounded-md text-[11px] font-bold uppercase tracking-wider">{log.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[11px] font-bold uppercase tracking-wider">{log.module}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.entityId ? `ID: ${log.entityId}` : "—"}</td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{formatDate(log.createdAt)}</td>
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
