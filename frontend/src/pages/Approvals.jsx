import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api, showToast } from "../services/api.js";
import { formatCurrency } from "../services/utils.js";
import {
  CheckSquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";

export default function Approvals() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const [selectedApproval, setSelectedApproval] = useState(null);
  const [remarks, setRemarks] = useState("");

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  useEffect(() => {
    loadApprovals();
  }, [statusFilter]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/approvals");
      let list = res.data || [];
      if (statusFilter !== "All") {
        list = list.filter((a) => a.status === statusFilter.toUpperCase());
      }
      setApprovals(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (action) => {
    if (!selectedApproval) return;
    try {
      const res = await api.post(`/api/approvals/${selectedApproval.id}/${action}`, { remarks });
      showToast(res.message || `Request ${action}d successfully`, action === "approve" ? "success" : "info");
      setSelectedApproval(null);
      setRemarks("");
      loadApprovals();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Approvals Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Review and act on procurement approval requests</p>
        </div>
        <div>
          <button
            onClick={loadApprovals}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table Card (Page 12 of PDF) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        {/* Tab Filter Pills */}
        <div className="flex items-center space-x-2">
          {["All", "Pending", "Approved", "Rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {st} <span className="opacity-75">({st === "All" ? approvals.length : approvals.filter((a) => a.status === st.toUpperCase()).length})</span>
            </button>
          ))}
        </div>

        {/* Data Table (Page 12 of PDF) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">RFQ</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">VENDOR</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">DELIVERY</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">REVIEWER</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATUS</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-12 text-slate-400 font-medium">Loading approval queue...</td></tr>
              ) : approvals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CheckCircle className="w-10 h-10 text-slate-300" />
                      <span className="font-medium text-xs">No approvals found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                approvals.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{a.rfq?.title || "RFQ"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{a.quotation?.vendor?.companyName || a.quotation?.vendorName || "Vendor"}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(a.quotation?.totalAmount || 0)}</td>
                    <td className="px-4 py-3 text-slate-500">{a.quotation?.deliveryTimeline || "N/A"}</td>
                    <td className="px-4 py-3 text-slate-500">{a.reviewedBy ? `${a.reviewedBy.firstName} ${a.reviewedBy.lastName}` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        a.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        a.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isManager && a.status === 'PENDING' && (
                        <button
                          onClick={() => { setSelectedApproval(a); setRemarks(""); }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] shadow-xs"
                        >
                          Review Request
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Review Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Manager Approval Decision</h3>
              <button onClick={() => setSelectedApproval(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 text-xs">
                <div><strong>RFQ:</strong> {selectedApproval.rfq?.title || "RFQ"}</div>
                <div><strong>Selected Vendor:</strong> {selectedApproval.quotation?.vendor?.companyName || "Vendor"}</div>
                <div><strong>Total Amount:</strong> {formatCurrency(selectedApproval.quotation?.totalAmount || 0)}</div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">APPROVAL REMARKS</label>
                <textarea
                  rows="3"
                  placeholder="Add approval or rejection remarks..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => handleDecision("reject")}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => handleDecision("approve")}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Approve Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
