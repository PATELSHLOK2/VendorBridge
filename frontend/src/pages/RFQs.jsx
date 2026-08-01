import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api, showToast } from "../services/api.js";
import { formatDate } from "../services/utils.js";
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  ArrowLeft,
  Upload,
  Calendar,
  CheckCircle,
} from "lucide-react";

export default function RFQs() {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Wizard State (Page 9 of PDF)
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Details, 2: Review, 3: Confirm
  const [activeVendors, setActiveVendors] = useState([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [rfqTitle, setRfqTitle] = useState("");
  const [rfqCategory, setRfqCategory] = useState("");
  const [rfqDeadline, setRfqDeadline] = useState("");
  const [rfqDesc, setRfqDesc] = useState("");
  const [items, setItems] = useState([{ itemName: "", quantity: 1, unit: "pcs" }]);

  const isStaff = user?.role === "ADMIN" || user?.role === "PROCUREMENT_OFFICER";

  useEffect(() => {
    loadRFQs();
  }, [statusFilter]);

  const loadRFQs = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === "All" ? "" : statusFilter;
      const url = statusParam ? `/api/rfqs?status=${statusParam}` : "/api/rfqs";
      const res = await api.get(url);
      setRfqs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, action) => {
    try {
      await api.post(`/api/rfqs/${id}/${action}`);
      showToast(`RFQ ${action}ed successfully`, "success");
      loadRFQs();
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateWizard = async () => {
    try {
      const vendorRes = await api.get("/api/vendors?status=ACTIVE");
      setActiveVendors(vendorRes.data || []);
      setSelectedVendorIds([]);
      setRfqTitle("");
      setRfqCategory("");
      setRfqDeadline("");
      setRfqDesc("");
      setItems([{ itemName: "", quantity: 1, unit: "pcs" }]);
      setWizardStep(1);
      setIsWizardOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { itemName: "", quantity: 1, unit: "pcs" }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleVendorCheckboxChange = (vendorId) => {
    if (selectedVendorIds.includes(vendorId)) {
      setSelectedVendorIds(selectedVendorIds.filter((id) => id !== vendorId));
    } else {
      setSelectedVendorIds([...selectedVendorIds, vendorId]);
    }
  };

  const handleSubmitRFQ = async () => {
    if (selectedVendorIds.length === 0) {
      showToast("Please assign at least one active vendor.", "error");
      return;
    }

    const payload = {
      title: rfqTitle.trim(),
      category: rfqCategory.trim(),
      deadline: rfqDeadline ? new Date(rfqDeadline) : null,
      description: rfqDesc.trim(),
      vendorIds: selectedVendorIds,
      items: items.map((it) => ({
        itemName: it.itemName.trim(),
        quantity: parseFloat(it.quantity) || 1,
        unit: it.unit.trim(),
      })),
    };

    try {
      await api.post("/api/rfqs", payload);
      showToast("RFQ created successfully as DRAFT", "success");
      setIsWizardOpen(false);
      loadRFQs();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  // Multi-step RFQ Wizard View (Page 9 of PDF)
  if (isWizardOpen) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setIsWizardOpen(false)}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to RFQs</span>
        </button>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create RFQ</h1>
          <p className="text-xs text-slate-500 mt-0.5">new request for quotation</p>
        </div>

        {/* 3-Step Wizard Indicator */}
        <div className="flex items-center justify-center space-x-12 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep === 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              1
            </div>
            <span className={`text-xs font-bold ${wizardStep === 1 ? "text-blue-600" : "text-slate-400"}`}>RFQ Details</span>
          </div>
          <div className="w-16 h-0.5 bg-slate-200"></div>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep === 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              2
            </div>
            <span className={`text-xs font-bold ${wizardStep === 2 ? "text-blue-600" : "text-slate-400"}`}>Review</span>
          </div>
          <div className="w-16 h-0.5 bg-slate-200"></div>
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep === 3 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              3
            </div>
            <span className={`text-xs font-bold ${wizardStep === 3 ? "text-blue-600" : "text-slate-400"}`}>Confirm</span>
          </div>
        </div>

        {/* Wizard Form Content */}
        {wizardStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Inputs */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">RFQ TITLE *</label>
                <input
                  type="text"
                  required
                  placeholder="Office Furniture procurement Q2"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">CATEGORY</label>
                <input
                  type="text"
                  placeholder="Furniture"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  value={rfqCategory}
                  onChange={(e) => setRfqCategory(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">DEADLINE *</label>
                <input
                  type="date"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  value={rfqDeadline}
                  onChange={(e) => setRfqDeadline(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">DESCRIPTION</label>
                <textarea
                  rows="3"
                  placeholder="Ergonomic chairs and standing desks for 3rd floor..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  value={rfqDesc}
                  onChange={(e) => setRfqDesc(e.target.value)}
                ></textarea>
              </div>
            </div>

            {/* Right Cards: Line Items, Assign Vendors, Attachments */}
            <div className="space-y-6">
              {/* LINE ITEMS Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-900">LINE ITEMS</span>
                  <button type="button" onClick={handleAddItem} className="text-xs font-bold text-blue-600 hover:underline">
                    + add line item
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Ergonomic chair"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                        value={it.itemName}
                        onChange={(e) => handleItemChange(i, "itemName", e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="1"
                        className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-center"
                        value={it.quantity}
                        onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="pcs"
                        className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-center"
                        value={it.unit}
                        onChange={(e) => handleItemChange(i, "unit", e.target.value)}
                      />
                      {items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(i)} className="text-red-500 hover:text-red-700 text-xs font-bold px-1">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ASSIGN VENDORS Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-900 block">ASSIGN VENDORS</span>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-2">
                  {activeVendors.map((v) => (
                    <label key={v.id} className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedVendorIds.includes(v.id)}
                        onChange={() => handleVendorCheckboxChange(v.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{v.companyName} ({v.vendorName})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ATTACHMENTS Area */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6">
                <span className="text-xs font-bold uppercase text-slate-900 block mb-3">ATTACHMENTS</span>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Drag & drop files or <span className="text-blue-600 underline cursor-pointer">click to upload</span>
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">PDF, XLSX, DOCX, PNG up to 10 MB</span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!rfqTitle) { showToast("Please enter an RFQ title", "error"); return; }
                    setWizardStep(2);
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
                >
                  Review RFQ &gt;
                </button>
              </div>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 max-w-2xl mx-auto space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Review Request for Quotation</h3>
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
              <div><strong>Title:</strong> {rfqTitle}</div>
              <div><strong>Category:</strong> {rfqCategory || "General"}</div>
              <div><strong>Deadline:</strong> {rfqDeadline || "N/A"}</div>
              <div><strong>Assigned Vendors:</strong> {selectedVendorIds.length} suppliers selected</div>
              <div><strong>Line Items:</strong> {items.length} items</div>
            </div>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setWizardStep(1)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold">Back</button>
              <button type="button" onClick={handleSubmitRFQ} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md">Submit Draft RFQ</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RFQ Master List View (Page 8 of PDF)
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Requests for Quotation (RFQs)</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage procurement requests and select winning quotations</p>
        </div>
        <div>
          {isStaff && (
            <button
              onClick={openCreateWizard}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create RFQ</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by number or title..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Tab Pills & Refresh */}
          <div className="flex items-center space-x-2">
            {["All", "Draft", "Published", "Closed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {st}
              </button>
            ))}
            <button
              onClick={loadRFQs}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">RFQ NUMBER</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">TITLE</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">CATEGORY</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATUS</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">DEADLINE</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ITEMS</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-12 text-slate-400 font-medium">Loading RFQs...</td></tr>
              ) : rfqs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <span className="font-medium text-xs">No RFQs found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rfqs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.rfqNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.title}</td>
                    <td className="px-4 py-3 text-slate-500">{r.category || "General"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        r.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        r.status === 'DRAFT' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.deadline)}</td>
                    <td className="px-4 py-3 text-slate-500">{(r.items || []).length} items</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {isStaff && r.status === 'DRAFT' && (
                          <button onClick={() => handleUpdateStatus(r.id, "publish")} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px]">
                            Publish
                          </button>
                        )}
                        {isStaff && r.status === 'PUBLISHED' && (
                          <button onClick={() => handleUpdateStatus(r.id, "close")} className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px]">
                            Close
                          </button>
                        )}
                        {user.role === 'VENDOR' && r.status === 'PUBLISHED' && (
                          <Link to="/quotations" className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px]">
                            Submit Quote
                          </Link>
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
    </div>
  );
}
