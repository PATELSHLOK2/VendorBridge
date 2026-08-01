import React, { useEffect, useState } from "react";
import { api, showToast } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Shield,
  Briefcase,
  UserCheck,
  Building2,
  Trash2,
  Edit,
  X,
  Lock,
  Mail,
  Phone,
  Globe,
  Plus,
} from "lucide-react";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "Password123",
    role: "PROCUREMENT_OFFICER",
    phone: "",
    country: "",
    additionalInfo: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/users");
      setUsers(res.data || []);
    } catch (err) {
      showToast(err.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "Password123",
      role: "PROCUREMENT_OFFICER",
      phone: "",
      country: "",
      additionalInfo: "",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      password: "", // Leave blank if keeping existing
      role: u.role || "PROCUREMENT_OFFICER",
      phone: u.phone || "",
      country: u.country || "",
      additionalInfo: u.additionalInfo || "",
    });
    setShowModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    setFormSubmitting(true);
    try {
      if (editingUser) {
        // Update user
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't update password if empty
        await api.put(`/api/users/${editingUser.id}`, payload);
        showToast("User updated successfully", "success");
      } else {
        // Create user
        if (!formData.password) {
          showToast("Password is required for new users", "error");
          setFormSubmitting(false);
          return;
        }
        await api.post("/api/users", formData);
        showToast(`New ${getRoleBadgeText(formData.role)} created successfully!`, "success");
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      showToast(err.message || "Operation failed", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (id === currentUser.id) {
      showToast("You cannot delete your own account", "error");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return;
    try {
      await api.delete(`/api/users/${id}`);
      showToast("User deleted successfully", "success");
      loadUsers();
    } catch (err) {
      showToast(err.message || "Failed to delete user", "error");
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "PROCUREMENT_OFFICER":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "MANAGER":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "VENDOR":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getRoleBadgeText = (role) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "PROCUREMENT_OFFICER":
        return "Procurement Officer";
      case "MANAGER":
        return "Manager";
      case "VENDOR":
        return "Vendor";
      default:
        return role;
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      `${u.firstName} ${u.lastName} ${u.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Create and manage Procurement Officers, Managers, Administrators, and Vendors
          </p>
        </div>
        <div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Role Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedRole("PROCUREMENT_OFFICER")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === "PROCUREMENT_OFFICER"
              ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
              : "bg-white border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Procurement Officers
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {users.filter((u) => u.role === "PROCUREMENT_OFFICER").length}
          </div>
        </div>

        <div
          onClick={() => setSelectedRole("MANAGER")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === "MANAGER"
              ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20"
              : "bg-white border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Managers
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {users.filter((u) => u.role === "MANAGER").length}
          </div>
        </div>

        <div
          onClick={() => setSelectedRole("ADMIN")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === "ADMIN"
              ? "bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20"
              : "bg-white border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Administrators
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {users.filter((u) => u.role === "ADMIN").length}
          </div>
        </div>

        <div
          onClick={() => setSelectedRole("VENDOR")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === "VENDOR"
              ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Vendors
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {users.filter((u) => u.role === "VENDOR").length}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Role Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "ALL", label: "All Users" },
            { id: "PROCUREMENT_OFFICER", label: "Officers" },
            { id: "MANAGER", label: "Managers" },
            { id: "ADMIN", label: "Admins" },
            { id: "VENDOR", label: "Vendors" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRole(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedRole === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-medium">
            Loading users list...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            No users found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Contact Info</th>
                  <th className="py-4 px-6">Country</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredUsers.map((u) => {
                  const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="text-slate-400 text-[11px]">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full border text-[11px] font-bold inline-block ${getRoleBadge(
                            u.role
                          )}`}
                        >
                          {getRoleBadgeText(u.role)}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-500">
                        {u.phone || "N/A"}
                      </td>

                      <td className="py-4 px-6 text-slate-500">
                        {u.country || "N/A"}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {editingUser ? "Edit User Account" : "Create Manager / Officer User"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUser ? "Update details & credentials" : "Assign role and generate login credentials"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-6 space-y-4">
              {/* ROLE SELECTOR (Critical for adding Officers / Managers) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  USER ROLE <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="VENDOR">Vendor</option>
                </select>
              </div>

              {/* FIRST NAME & LAST NAME */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    FIRST NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    LAST NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              {/* EMAIL & PASSWORD */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    EMAIL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@vendorbridge.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    PASSWORD {editingUser ? "(Optional)" : "*"}
                  </label>
                  <input
                    type="text"
                    placeholder={editingUser ? "Leave blank to keep" : "Password123"}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none font-mono"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              {/* PHONE & COUNTRY */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    PHONE
                  </label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    COUNTRY
                  </label>
                  <input
                    type="text"
                    placeholder="United States"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              {/* ADDITIONAL NOTES */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  ADDITIONAL NOTES
                </label>
                <textarea
                  rows="2"
                  placeholder="Department or additional comments..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                ></textarea>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingUser ? "Update User" : "Create User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
