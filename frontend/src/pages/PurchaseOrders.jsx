import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api, showToast } from "../services/api.js";
import { formatDate } from "../services/utils.js";
import { ShoppingBag, Eye, CheckCircle, Clock } from "lucide-react";

export default function PurchaseOrders() {
  const { user } = useAuth();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPo, setSelectedPo] = useState(null);

  const isStaff = user?.role === "ADMIN" || user?.role === "PROCUREMENT_OFFICER";

  useEffect(() => {
    loadPOs();
  }, []);

  const loadPOs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/purchase-orders");
      setPos(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/api/purchase-orders/${id}/status`, { status: newStatus });
      showToast(`PO status updated to ${newStatus}`, "success");
      loadPOs();
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Purchase Orders (POs)</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage and track issued purchase orders</p>
        </div>
      </div>

      {/* Main Table Card (Page 13 of PDF) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">PO NUMBER</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">RFQ NUMBER / TITLE</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">VENDOR</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATUS</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ISSUE DATE</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-medium">Loading purchase orders...</td></tr>
              ) : pos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShoppingBag className="w-10 h-10 text-slate-300" />
                      <span className="font-medium text-xs">No purchase orders found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pos.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{po.poNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{po.rfq?.title || "RFQ"}</td>
                    <td className="px-4 py-3 text-slate-500">{po.vendor?.companyName || "Vendor"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        po.status === 'FULFILLED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        po.status === 'ISSUED' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(po.issueDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => setSelectedPo(po)} className="text-slate-600 hover:text-blue-600 font-semibold flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        {isStaff && po.status !== 'FULFILLED' && (
                          <select
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium"
                            value={po.status}
                            onChange={(e) => handleStatusChange(po.id, e.target.value)}
                          >
                            <option value="ISSUED">ISSUED</option>
                            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                            <option value="FULFILLED">FULFILLED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Detail Modal */}
      {selectedPo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Purchase Order Details — {selectedPo.poNumber}</h3>
              <button onClick={() => setSelectedPo(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 text-xs">
                <div><strong>Vendor:</strong> {selectedPo.vendor?.companyName || "Vendor"}</div>
                <div><strong>RFQ:</strong> {selectedPo.rfq?.title || "RFQ"}</div>
                <div><strong>Issue Date:</strong> {formatDate(selectedPo.issueDate)}</div>
                <div><strong>Status:</strong> {selectedPo.status}</div>
              </div>

              <span className="text-xs font-bold uppercase text-slate-500 block">PO LINE ITEMS</span>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="p-2 font-bold text-slate-400">ITEM</th>
                    <th className="p-2 font-bold text-slate-400">QTY</th>
                    <th className="p-2 font-bold text-slate-400">PRICE</th>
                    <th className="p-2 font-bold text-slate-400">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedPo.items || []).map((item, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-2 font-medium">{item.itemName}</td>
                      <td className="p-2 text-slate-500">{item.quantity}</td>
                      <td className="p-2 text-slate-500">${Number(item.unitPrice).toFixed(2)}</td>
                      <td className="p-2 font-bold">${Number(item.totalAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
