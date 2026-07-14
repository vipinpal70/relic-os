"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Lock, User, Mail, Phone, MapPin, Shield } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSession } from "@/components/providers/SessionProvider";

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const { user } = useSession();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <AppLayout title="Profile">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="My Profile"
          subtitle="Manage your personal information"
          actions={
            <button
              onClick={() => setEditing(!editing)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                editing ? "bg-green-600 text-white hover:bg-green-700" : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              }`}
            >
              {editing ? "Save Changes" : "Edit Profile"}
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar card */}
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-2xl gradient-blue flex items-center justify-center text-white text-3xl font-bold">
                {initials}
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-center hover:bg-[#F7F8FA] transition-colors shadow-sm">
                <Camera size={14} className="text-[#6B7280]" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-[#111827]">{user?.name || "User"}</h2>
            <p className="text-sm text-[#6B7280] mb-3">{user?.email || "No email provided"}</p>
            <StatusBadge status={user?.role || "Team"} />

            <div className="w-full mt-6 pt-4 border-t border-[#F3F4F6] space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9CA3AF]">Member since</span>
                <span className="font-medium text-[#374151]">Jan 2024</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9CA3AF]">Last login</span>
                <span className="font-medium text-[#374151]">Today, 9:30 AM</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#9CA3AF]">Status</span>
                <span className="font-medium text-green-600">{user?.status || "Active"}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[#111827] mb-4 flex items-center gap-2">
                <User size={15} className="text-[#2563EB]" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: user?.name || "—", icon: User, editable: true },
                  { label: "Email Address", value: user?.email || "—", icon: Mail, editable: true },
                  { label: "Phone Number", value: user?.phone || "+91 9111111111", icon: Phone, editable: true },
                  { label: "Location", value: "Mumbai, India", icon: MapPin, editable: true },
                ].map(({ label, value, icon: Icon, editable }) => (
                  <div key={label}>
                    <label className="block text-xs text-[#6B7280] font-medium mb-1">{label}</label>
                    {editing && editable ? (
                      <input
                        defaultValue={value}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F8FA] rounded-lg text-sm text-[#374151]">
                        <Icon size={13} className="text-[#9CA3AF]" />
                        {value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Read-only fields */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[#111827] mb-4 flex items-center gap-2">
                <Shield size={15} className="text-[#6366F1]" />
                Role & Assignment
                <span className="ml-2 text-xs text-[#9CA3AF] font-normal">(Not editable)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Role", value: user?.role || "Team" },
                  { label: "Team / Tag", value: user?.tag || "Senior RM" },
                  { label: "Channel Partner", value: user?.assigned_partner || "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <label className="block text-xs text-[#6B7280] font-medium mb-1">{label}</label>
                    <div className="px-3 py-2 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280] cursor-not-allowed">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Password */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[#111827] mb-4 flex items-center gap-2">
                <Lock size={15} className="text-[#F59E0B]" />
                Change Password
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {["Current Password", "New Password", "Confirm Password"].map((label) => (
                  <div key={label}>
                    <label className="block text-xs text-[#6B7280] font-medium mb-1">{label}</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                ))}
              </div>
              <button className="mt-4 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors">
                Update Password
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}

