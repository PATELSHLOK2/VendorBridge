import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api, showToast } from "../services/api.js";
import { formatCurrency, formatDate } from "../services/utils.js";
import {
  MessageSquare,
  RefreshCw,
  Plus,
  Building2,
  FileText,
  Truck,
  Award,
} from "lucide-react";

export default function Quotations() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vendor Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [publishedRFQs, setPublishedRFQs] = useState([]);
  const [selectedRfqId, setSelectedRfqId] = useState("");
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [quoteTimeline, setQuoteTimeline] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteItems, setQuoteItems] = useState([]);

  // Comparison Matrix Modal (Page 11 of PDF)
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareQuotes, setCompareQuotes] = useState([]);

  const isVendor = user?.role === "VENDOR";

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/quotations");
      setQuotations(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openVendorModal = async () => {
    try {
      const rfqRes = await api.get("/api/rfqs?status=PUBLISHED");
      const list = rfqRes.data || [];
      if (list.length === 0) {
        showToast("No active published RFQs assigned to you.", "info");
        return;
      }
      setPublishedRFQs(list);
      setSelectedRfqId("");
      setSelectedRfq(null);
      setQuoteTimeline("");
      setQuoteNotes("");
      setQuoteItems([]);
      setShowSubmitModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRfqSelectChange = async (e) => {
    const rfqId = e.target.value;
    setSelectedRfqId(rfqId);
    if (!rfqId) {
      setSelectedRfq(null);
      setQuoteItems([]);
      return;
    }

    try {
      const rfqDetailRes = await api.get(`/api/rfqs/${rfqId}`);
      const rfqData = rfqDetailRes.data;
      setSelectedRfq(rfqData);
      setQuoteItems(
        (rfqData.items || []).map((it) => ({
          rfqItemId: it.id,
          itemName: it.itemName,
          quantity: it.quantity,
          unitPrice: 0,
          taxPercentage: 0,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuoteItemChange = (index, field, value) => {
    const updated = [...quoteItems];
    updated[index][field] = parseFloat(value) || 0;
    setQuoteItems(updated);
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    const payload = {
      rfqId: selectedRfqId,
      deliveryTimeline: quoteTimeline.trim(),
      notes: quoteNotes.trim(),
      items: quoteItems.map((it) => ({
        rfqItemId: it.rfqItemId,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        taxPercentage: it.taxPercentage,
      })),
    };

    try {
      await api.post("/api/quotations/submit", payload);
      showToast("Quotation submitted successfully!", "success");
      setShowSubmitModal(false);
      loadQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  const openComparisonModal = async (rfqId) => {
    try {
      const res = await api.get(`/api/quotations?rfqId=${rfqId}`);
      const list = res.data || [];
      if (list.length === 0) {
        showToast("No quotations submitted for this RFQ yet.", "info");
        return;
      }
      setCompareQuotes(list);
      setShowCompareModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectQuote = async (id) => {
    try {
      await api.post(`/api/quotations/${id}/select`);
      showToast("Quotation selected! Submitted to Manager for approval.", "success");
      setShowCompareModal(false);
      loadQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  const lowestPrice = compareQuotes.length > 0 ? Math.min(...compareQuotes.map((q) => Number(q.totalAmount))) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quotations</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {isVendor ? "Submit pricing proposals for assigned RFQs" : "Manage bids and compare vendor submissions"}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadQuotations}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          {isVendor && (
            <button
              onClick={openVendorModal}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Quote</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Quotations Card (Page 10 of PDF) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900">All Quotations</h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-medium">Loading quotations...</div>
          ) : quotations.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300" />
              <span className="text-sm font-medium text-slate-400">No quotations yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">RFQ TITLE</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">VENDOR</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">TIMELINE</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL AMOUNT</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATUS</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{q.rfq?.title || "RFQ"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{q.vendor?.companyName || q.vendor?.vendorName || "Vendor"}</td>
                      <td className="px-4 py-3 text-slate-500">{q.deliveryTimeline || "N/A"}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(q.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          q.status === 'SELECTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          q.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          q.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!isVendor && q.status === 'SUBMITTED' && (
                          <button
                            onClick={() => openComparisonModal(q.rfq?.id || q.rfq)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] shadow-xs"
                          >
                            Compare & Select
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Submit Quotation Modal (Vendor) */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Submit Quotation Proposal</h3>
                <p className="text-xs text-slate-500">Submit your itemized pricing quote for an assigned RFQ</p>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1">✕</button>
            </div>

            <form onSubmit={handleSubmitQuote} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">SELECT ASSIGNED RFQ *</label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  value={selectedRfqId}
                  onChange={handleRfqSelectChange}
                >
                  <option value="">-- Choose a published RFQ --</option>
                  {publishedRFQs.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.rfqNumber} — {r.title} ({r.category || "General"})
                    </option>
                  ))}
                </select>
              </div>

              {selectedRfq && (
                <>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-1 text-xs">
                    <div><strong>RFQ Title:</strong> {selectedRfq.title}</div>
                    <div><strong>Deadline:</strong> {formatDate(selectedRfq.deadline)}</div>
                    <div><strong>Description:</strong> {selectedRfq.description || "N/A"}</div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">DELIVERY TIMELINE *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 7-10 Business Days"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                      value={quoteTimeline}
                      onChange={(e) => setQuoteTimeline(e.target.value)}
                    />
                  </div>

                  {/* Itemized Pricing Grid */}
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-500 block mb-2">ITEM PRICING & TAX BREAKDOWN *</span>
                    <div className="space-y-3">
                      {quoteItems.map((it, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span>{it.itemName}</span>
                            <span className="text-slate-500">Qty: {it.quantity}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block">UNIT PRICE (₹) *</label>
                              <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:outline-none"
                                value={it.unitPrice}
                                onChange={(e) => handleQuoteItemChange(idx, "unitPrice", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 block">TAX RATE (%)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="18"
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:outline-none"
                                value={it.taxPercentage}
                                onChange={(e) => handleQuoteItemChange(idx, "taxPercentage", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">PROPOSAL NOTES / REMARKS</label>
                    <textarea
                      rows="2"
                      placeholder="Additional terms, warranty, or delivery notes..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                    ></textarea>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedRfqId}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Matrix Modal (Page 11 of PDF) */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Quotation Comparison Matrix</h3>
                <p className="text-xs text-slate-500">Side-by-side bid evaluation matrix for informed vendor selection</p>
              </div>
              <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1">✕</button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compareQuotes.map((q) => {
                  const isLowest = Number(q.totalAmount) === lowestPrice;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl p-6 relative border transition-all ${
                        isLowest
                          ? "border-emerald-500 bg-emerald-50/30 shadow-lg shadow-emerald-500/10"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      {isLowest && (
                        <span className="absolute -top-3 right-4 px-3 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-xs flex items-center space-x-1">
                          <Award className="w-3 h-3 inline" />
                          <span>Lowest Price</span>
                        </span>
                      )}

                      <div className="flex items-center space-x-2 mb-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <h4 className="font-extrabold text-slate-900 text-sm">{q.vendor?.companyName || q.vendor?.vendorName || "Vendor"}</h4>
                      </div>
                      <p className="text-xs text-slate-500">Contact: {q.vendor?.contactPerson || "N/A"}</p>

                      <hr className="my-4 border-slate-100" />

                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL BID AMOUNT</span>
                          <span className={`text-2xl font-extrabold ${isLowest ? "text-emerald-600" : "text-slate-900"}`}>
                            {formatCurrency(q.totalAmount)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-slate-600 pt-2">
                          <Truck className="w-4 h-4 text-slate-400" />
                          <span>Timeline: <strong>{q.deliveryTimeline || "N/A"}</strong></span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          onClick={() => handleSelectQuote(q.id)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
                        >
                          Select This Vendor
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
