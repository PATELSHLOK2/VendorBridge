import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api, showToast } from "../services/api.js";
import {
  Building2,
  Plus,
  Search,
  ArrowLeft,
  Phone,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react";

export default function Vendors() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Add/Edit Vendor Form Page View (Page 7 of PDF)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    contactPerson: "",
    companyName: "",
    vendorName: "",
    email: "",
    phone: "",
    category: "",
    gstNumber: "",
    status: "ACTIVE",
    address: "",
  });

  useEffect(() => {
    loadVendors();
  }, [search, statusFilter]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      let url = "/api/vendors?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter !== "All") url += `status=${encodeURIComponent(statusFilter.toUpperCase())}&`;
      const res = await api.get(url);
      setVendors(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const vendorRes = await api.get(`/api/vendors/${id}`);
      const vendorData = vendorRes.data;
      vendorData.status = newStatus;
      await api.put(`/api/vendors/${id}`, vendorData);
      showToast(`Vendor status updated to ${newStatus}`, "success");
      loadVendors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vendor record?")) return;
    try {
      await api.delete(`/api/vendors/${id}`);
      showToast("Vendor deleted successfully", "success");
      loadVendors();
    } catch (err) {
      console.error(err);
    }
  };

  const openForm = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        contactPerson: vendor.contactPerson || "",
        companyName: vendor.companyName || "",
        vendorName: vendor.vendorName || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        category: vendor.category || "",
        gstNumber: vendor.gstNumber || "",
        status: vendor.status || "ACTIVE",
        address: vendor.address || "",
      });
    } else {
      setEditingVendor(null);
      setFormData({
        contactPerson: "",
        companyName: "",
        vendorName: "",
        email: "",
        phone: "",
        category: "",
        gstNumber: "",
        status: "ACTIVE",
        address: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await api.put(`/api/vendors/${editingVendor.id}`, formData);
        showToast("Vendor updated successfully", "success");
      } else {
        await api.post("/api/vendors", formData);
        showToast("Vendor created successfully", "success");
      }
      setIsFormOpen(false);
      loadVendors();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  // Add Vendor Page/Form View (Page 7 of PDF)
  if (isFormOpen) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <button
          onClick={() => setIsFormOpen(false)}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vendors</span>
        </button>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {editingVendor ? "Edit Vendor Profile" : "Register New Vendor"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {editingVendor ? "Update supplier registry details" : "Add a new supplier to your vendor registry"}
          </p>
        </div>

        <form onSubmit={handleSubmitForm} className="bg-white rounded-3xl border border-slate-200/80 p-8 space-y-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">CONTACT PERSON *</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">COMPANY NAME *</label>
              <input
                type="text"
                required
                placeholder="Tech Supplies Pvt Ltd"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">VENDOR / ACCOUNT NAME *</label>
              <input
                type="text"
                required
                placeholder="Infra Supplies PVT Ltd"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">EMAIL ADDRESS *</label>
              <input
                type="email"
                required
                disabled={!!editingVendor}
                placeholder="contact@techsupplies.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">PHONE NUMBER</label>
              <input
                type="text"
                placeholder="+1 234 567 890"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">CATEGORY</label>
              <input
                type="text"
                placeholder="e.g. Construction, IT, Logistics"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">GST NUMBER</label>
              <input
                type="text"
                placeholder="27AAPFU0939F1ZV"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">STATUS</label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">ADDRESS</label>
            <textarea
              rows="2"
              placeholder="123 Industrial Parkway, Suite A"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            ></textarea>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
            >
              {editingVendor ? "Update Vendor" : "Register Vendor"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Master Directory View (Page 6 of PDF)
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Vendors</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage supplier profiles and registrations</p>
        </div>
        <div>
          <button
            onClick={() => openForm()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, GST number, category..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tab Filter Pills */}
        <div className="flex items-center space-x-2">
          {["All", "Active", "Pending", "Blocked", "Inactive"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {st} <span className="opacity-75">({st === "All" ? vendors.length : vendors.filter((v) => v.status === st.toUpperCase()).length})</span>
            </button>
          ))}
        </div>

        {/* Data Table (Page 6 of PDF) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">VENDOR NAME</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">CATEGORY</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">GST NO.</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">CONTACT NO.</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">STATUS</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-medium">Loading vendors...</td></tr>
              ) : vendors.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-medium">No vendors found.</td></tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="font-bold text-slate-900 block">{v.companyName}</span>
                          <span className="text-[11px] text-slate-400 block">{v.vendorName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{v.category || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{v.gstNumber || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{v.phone || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                        v.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => openForm(v)} className="text-slate-600 hover:text-blue-600 font-semibold flex items-center space-x-1">
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        {v.status === 'INACTIVE' && (
                          <button onClick={() => handleUpdateStatus(v.id, "ACTIVE")} className="text-emerald-600 font-semibold hover:underline">
                            Approve
                          </button>
                        )}
                        {user.role === 'ADMIN' && (
                          <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
