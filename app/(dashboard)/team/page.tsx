"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, Key, X, Users, CheckCircle, ShieldAlert, Briefcase, FileText, UserCheck, Lock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface UserProfile {
  employeeId?: string;
  department?: string;
  designation?: string;
  reportingManagerId?: string;
  pan?: string;
  aadhaar?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  companyName?: string;
  alternativePhone?: string;
  address?: string;
  state?: string;
  city?: string;
  gst?: string;
  notes?: string;
}

interface EnrichedUser {
  _id: string;
  name: string;
  email: string;
  role: "Admin" | "Team" | "Channel Partner";
  phone?: string;
  status: "Active" | "Inactive";
  tag?: string;
  assigned_partner?: string;
  profile?: UserProfile | null;
  createdAt: string;
}

const roleFilters = ["All", "Admin", "Team", "Channel Partner"];

export default function TeamPage() {
  const [usersList, setUsersList] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EnrichedUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"credentials" | "profile">("credentials");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Team" as "Admin" | "Team" | "Channel Partner",
    phone: "",
    status: "Active" as "Active" | "Inactive",
    tag: "",
    assigned_partner: "",
    // Team Profile
    employeeId: "",
    department: "Sales",
    designation: "Relationship Manager",
    reportingManagerId: "",
    pan: "",
    aadhaar: "",
    bankAccountNumber: "",
    bankIfsc: "",
    // Channel Partner Profile
    companyName: "",
    alternativePhone: "",
    address: "",
    state: "",
    city: "",
    gst: "",
    notes: "",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error("Failed to fetch team list:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setActiveTab("credentials");
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "Team",
      phone: "",
      status: "Active",
      tag: "",
      assigned_partner: "",
      employeeId: "",
      department: "Sales",
      designation: "Relationship Manager",
      reportingManagerId: "",
      pan: "",
      aadhaar: "",
      bankAccountNumber: "",
      bankIfsc: "",
      companyName: "",
      alternativePhone: "",
      address: "",
      state: "",
      city: "",
      gst: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: EnrichedUser) => {
    setEditingUser(user);
    setActiveTab("credentials");
    
    // Populate form data
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Always clear password on edit
      role: user.role,
      phone: user.phone || "",
      status: user.status,
      tag: user.tag || "",
      assigned_partner: user.assigned_partner || "",
      // Team profile details
      employeeId: user.profile?.employeeId || "",
      department: user.profile?.department || "Sales",
      designation: user.profile?.designation || "Relationship Manager",
      reportingManagerId: user.profile?.reportingManagerId || "",
      pan: user.profile?.pan || "",
      aadhaar: user.profile?.aadhaar || "",
      bankAccountNumber: user.profile?.bankAccountNumber || "",
      bankIfsc: user.profile?.bankIfsc || "",
      // Channel partner details
      companyName: user.profile?.companyName || "",
      alternativePhone: user.profile?.alternativePhone || "",
      address: user.profile?.address || "",
      state: user.profile?.state || "",
      city: user.profile?.city || "",
      gst: user.profile?.gst || "",
      notes: user.profile?.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete their credentials and login access.")) {
      return;
    }

    try {
      const res = await fetch(`/api/team/${userId}`, { method: "DELETE" });
      if (res.ok) {
        alert("User deleted successfully.");
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user.");
      }
    } catch (e) {
      console.error(e);
      alert("Error occurred during deletion.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validations
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      alert("Please fill all required credentials fields.");
      return;
    }

    try {
      setSubmitting(true);
      const url = editingUser ? `/api/team/${editingUser._id}` : "/api/team";
      const method = editingUser ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filtered = usersList.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.tag && u.tag.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const avatarGradients = [
    "bg-gradient-to-tr from-blue-500 to-indigo-600",
    "bg-gradient-to-tr from-emerald-500 to-teal-600",
    "bg-gradient-to-tr from-amber-500 to-orange-600",
    "bg-gradient-to-tr from-rose-500 to-pink-600",
    "bg-gradient-to-tr from-violet-500 to-purple-600",
  ];

  return (
    <AppLayout title="Team Management">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="Team Management"
          subtitle="Manage credentials, access control, and profiles for internal team members and channel partners"
          actions={
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] transition-all shadow-sm"
            >
              <Plus size={16} />
              Add Member
            </button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Total Active Users", value: usersList.filter((u) => u.status === "Active").length, icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100" },
            { label: "Internal Team Members", value: usersList.filter((u) => u.role !== "Channel Partner").length, icon: UserCheck, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
            { label: "Connected Channel Partners", value: usersList.filter((u) => u.role === "Channel Partner").length, icon: Briefcase, color: "text-amber-600 bg-amber-50 border-amber-100" },
          ].map((s, i) => (
            <div key={i} className={`p-5 rounded-2xl border bg-white shadow-sm flex items-center justify-between`}>
              <div>
                <p className="text-sm font-medium text-[#6B7280]">{s.label}</p>
                <h3 className="text-3xl font-extrabold text-[#111827] mt-1">{loading ? "..." : s.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${s.color}`}>
                <s.icon size={22} />
              </div>
            </div>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member, email, tag..."
              className="pl-9 pr-4 py-2 w-full bg-white border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] transition-all font-medium text-[#111827] placeholder-[#9CA3AF] shadow-sm"
            />
          </div>
          <div className="flex gap-1.5 p-1 bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
            {roleFilters.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  roleFilter === r ? "bg-[#2563EB] text-white shadow-sm" : "text-[#374151] hover:bg-[#F9FAFB]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-xs font-bold text-[#374151] uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-[#374151] uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-[#374151] uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-bold text-[#374151] uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-[#374151] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#374151] uppercase tracking-wider">Tag / Context</th>
                <th className="px-6 py-4 text-xs font-bold text-[#374151] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6B7280] font-medium">
                    Loading users list...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#6B7280] font-medium">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user, i) => (
                  <tr key={user._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`${avatarGradients[i % avatarGradients.length]} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
                          {initials(user.name)}
                        </div>
                        <div>
                          <span className="font-semibold text-[#111827] text-sm block">{user.name}</span>
                          <span className="text-[11px] text-[#9CA3AF] block font-medium">
                            {user.role === "Channel Partner"
                              ? user.profile?.companyName || "Partner Profile"
                              : `${user.profile?.designation || "RM"} • ${user.profile?.department || "Sales"}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#4B5563] text-sm font-medium">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#4B5563] text-sm font-medium">{user.phone || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.tag ? (
                        <span className="text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full border border-blue-100">
                          {user.tag}
                        </span>
                      ) : (
                        <span className="text-xs text-[#9CA3AF] italic">No tag</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 hover:bg-[#EFF6FF] rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Edit Credentials & Profile"
                        >
                          <Edit2 size={14} className="text-[#2563EB]" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-1.5 hover:bg-[#FEF2F2] rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Delete User"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl border border-[#E5E7EB]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    {editingUser ? `Edit User: ${editingUser.name}` : "Create New User & Profile"}
                  </h3>
                  <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                    Setup authentication details and customize their functional profile record.
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-[#E5E7EB] rounded-lg text-[#4B5563]">
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#E5E7EB] px-6">
                <button
                  onClick={() => setActiveTab("credentials")}
                  className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === "credentials"
                      ? "border-[#2563EB] text-[#2563EB]"
                      : "border-transparent text-[#4B5563] hover:text-[#111827]"
                  }`}
                >
                  <Lock size={15} />
                  Login & Credentials
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === "profile"
                      ? "border-[#2563EB] text-[#2563EB]"
                      : "border-transparent text-[#4B5563] hover:text-[#111827]"
                  }`}
                >
                  <FileText size={15} />
                  Functional Profile
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit}>
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                  {activeTab === "credentials" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#374151] uppercase">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#374151] uppercase">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                          placeholder="e.g. rahul@relicos.com"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#374151] uppercase">
                          Password {editingUser ? "(Leave blank to keep current)" : "*"}
                        </label>
                        <input
                          type="password"
                          required={!editingUser}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                          placeholder={editingUser ? "••••••••" : "Enter temporary password"}
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#374151] uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                          placeholder="e.g. 9876543210"
                        />
                      </div>

                      {/* Role */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#374151] uppercase">Access Role *</label>
                        <select
                          value={formData.role}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              role: e.target.value as "Admin" | "Team" | "Channel Partner",
                            })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm bg-white focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                        >
                          <option value="Team">Team Member (RM)</option>
                          <option value="Admin">Administrator</option>
                          <option value="Channel Partner">Channel Partner</option>
                        </select>
                      </div>

                      {/* Status */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#374151] uppercase">Account Status *</label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })
                          }
                          className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm bg-white focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                        >
                          <option value="Active">Active (Permit Logins)</option>
                          <option value="Inactive">Inactive (Block Logins)</option>
                        </select>
                      </div>

                      {/* Tag */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#374151] uppercase">Label/Tag</label>
                        <input
                          type="text"
                          value={formData.tag}
                          onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                          className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                          placeholder="e.g. Senior RM, Partner, Manager"
                        />
                      </div>

                      {/* Context / Assigned Partner */}
                      {formData.role !== "Channel Partner" && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#374151] uppercase">Assigned Partner / Office</label>
                          <input
                            type="text"
                            value={formData.assigned_partner}
                            onChange={(e) => setFormData({ ...formData, assigned_partner: e.target.value })}
                            className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                            placeholder="e.g. Delhi Main Branch"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "profile" && (
                    <div className="space-y-4">
                      {/* Dynamic form header */}
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs font-semibold">
                        <Briefcase size={15} />
                        <span>
                          {formData.role === "Channel Partner"
                            ? "Entering Profile information for: Channel Partner"
                            : "Entering Profile information for: Internal Team Member"}
                        </span>
                      </div>

                      {formData.role === "Channel Partner" ? (
                        /* Channel Partner Fields */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">Company Name *</label>
                            <input
                              type="text"
                              value={formData.companyName}
                              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                              required={formData.role === "Channel Partner"}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                              placeholder="e.g. Apex Financials Ltd"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">Alt Phone Number</label>
                            <input
                              type="text"
                              value={formData.alternativePhone}
                              onChange={(e) => setFormData({ ...formData, alternativePhone: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                              placeholder="e.g. 9800000000"
                            />
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-bold text-[#374151] uppercase">Office Address</label>
                            <input
                              type="text"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                              placeholder="e.g. Sector-62, Noida"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">City</label>
                            <input
                              type="text"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                              placeholder="e.g. Noida"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">State</label>
                            <input
                              type="text"
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                              placeholder="e.g. Uttar Pradesh"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">GST Number</label>
                            <input
                              type="text"
                              value={formData.gst}
                              onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                              placeholder="e.g. 09AAACP1234A1Z5"
                            />
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-bold text-[#374151] uppercase">Internal Notes / Bio</label>
                            <textarea
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-medium text-[#111827]"
                              placeholder="Add special instructions, commission terms, etc."
                            />
                          </div>
                        </div>
                      ) : (
                        /* Team Profile Fields */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">Employee ID</label>
                            <input
                              type="text"
                              value={formData.employeeId}
                              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                              placeholder="e.g. EMP-1092"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">Department</label>
                            <select
                              value={formData.department}
                              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm bg-white focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                            >
                              <option value="Sales">Sales & Business Development</option>
                              <option value="Operations">Operations</option>
                              <option value="Credit">Credit / Underwriting</option>
                              <option value="Management">Management</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">Functional Designation</label>
                            <input
                              type="text"
                              value={formData.designation}
                              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                              placeholder="e.g. Associate Director, RM"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">PAN Number</label>
                            <input
                              type="text"
                              value={formData.pan}
                              onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827] uppercase"
                              placeholder="e.g. ABCDE1234F"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">Aadhaar Card Number</label>
                            <input
                              type="text"
                              value={formData.aadhaar}
                              onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                              placeholder="e.g. 1234 5678 9012"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#374151] uppercase">Salary Account IFSC</label>
                            <input
                              type="text"
                              value={formData.bankIfsc}
                              onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827] uppercase"
                              placeholder="e.g. HDFC0000123"
                            />
                          </div>

                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-bold text-[#374151] uppercase">Salary Account Number</label>
                            <input
                              type="text"
                              value={formData.bankAccountNumber}
                              onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] font-semibold text-[#111827]"
                              placeholder="Enter bank account number"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
                  <div className="text-xs text-[#9CA3AF] font-medium">
                    {activeTab === "credentials" ? "Proceed to functional details ->" : "<- Return to login details"}
                  </div>
                  <div className="flex gap-2">
                    {activeTab === "credentials" ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab("profile")}
                        className="px-4 py-2 border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#374151] text-sm font-semibold rounded-xl transition-all"
                      >
                        Next: Profile
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTab("credentials")}
                        className="px-4 py-2 border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#374151] text-sm font-semibold rounded-xl transition-all"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:bg-blue-300 text-sm font-semibold rounded-xl transition-all shadow-sm"
                    >
                      {submitting ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
