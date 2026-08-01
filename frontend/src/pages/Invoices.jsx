import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api, showToast } from "../services/api.js";
import { formatCurrency, formatDate } from "../services/utils.js";
import { CreditCard, Download, Mail } from "lucide-react";

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [emailRecipient, setEmailRecipient] = useState("");

  const isStaff = user?.role === "ADMIN" || user?.role === "PROCUREMENT_OFFICER";

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/invoices");
      setInvoices(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (id, invoiceNumber) => {
    try {
      showToast("Generating PDF document...", "info");
      const blob = await api.get(`/api/invoices/${id}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("PDF downloaded successfully", "success");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.post(`/api/invoices/${selectedInvoice.id}/email`, { email: emailRecipient });
      showToast(`Invoice email dispatched to ${emailRecipient}`, "success");
      setSelectedInvoice(null);
      loadInvoices();
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">View financial billing reports and download invoice PDFs</p>
        </div>
      </div>

      {/* Main Table Card (Page 14 of PDF) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">INVOICE NUMBER</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">PO NUMBER</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">VENDOR</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL AMOUNT</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATUS</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ISSUED AT</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-12 text-slate-400 font-medium">Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CreditCard className="w-10 h-10 text-slate-300" />
                      <span className="font-medium text-xs">No invoices generated yet.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{inv.purchaseOrder?.poNumber || "PO"}</td>
                    <td className="px-4 py-3 text-slate-500">{inv.vendor?.companyName || "Vendor"}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(inv.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        inv.status === 'SENT' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(inv.issuedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleDownloadPDF(inv.id, inv.invoiceNumber)} className="text-slate-600 hover:text-blue-600 font-semibold flex items-center space-x-1">
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                        {isStaff && (
                          <button onClick={() => { setSelectedInvoice(inv); setEmailRecipient(inv.vendor?.email || ""); }} className="text-blue-600 font-semibold flex items-center space-x-1 hover:underline">
                            <Mail className="w-3.5 h-3.5" />
                            <span>Email</span>
                          </button>
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

      {/* Email Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Send Invoice PDF Email</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">RECIPIENT EMAIL *</label>
                <input
                  type="email"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-1 text-xs">
                <div><strong>Invoice #:</strong> {selectedInvoice.invoiceNumber}</div>
                <div><strong>Grand Total:</strong> {formatCurrency(selectedInvoice.grandTotal)}</div>
                <div className="text-[11px] text-slate-400 mt-1">Attachment: {selectedInvoice.invoiceNumber}.pdf will be automatically generated and attached.</div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setSelectedInvoice(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs">Send Email</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
