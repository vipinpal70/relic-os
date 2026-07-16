"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Lock, User, Mail, Phone, Shield, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSession } from "@/components/providers/SessionProvider";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useSession();

  // Personal info editing
  const [editing, setEditing] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [infoSuccess, setInfoSuccess] = useState("");
  const [infoForm, setInfoForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const memberSince = (user as any)?.createdAt
    ? new Date((user as any).createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "—";

  const startEditing = () => {
    setInfoForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setInfoError("");
    setInfoSuccess("");
    setEditing(true);
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setInfoError("");
    setInfoSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(infoForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setInfoError(data.error || "Failed to update profile.");
        return;
      }
      setInfoSuccess("Profile updated successfully.");
      setEditing(false);
      router.refresh(); // re-render server layout so the session reflects the new details
    } catch {
      setInfoError("An unexpected error occurred. Please try again.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError("Please fill in the current and new password fields.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password.");
        return;
      }
      setPasswordSuccess("Password updated successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setPasswordError("An unexpected error occurred. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  const passwordFields: { key: keyof typeof passwordForm; label: string }[] = [
    { key: "currentPassword", label: "Current Password" },
    { key: "newPassword", label: "New Password" },
    { key: "confirmPassword", label: "Confirm Password" },
  ];

  const infoFields: { key: keyof typeof infoForm; label: string; icon: any; type: string }[] = [
    { key: "name", label: "Full Name", icon: User, type: "text" },
    { key: "email", label: "Email Address", icon: Mail, type: "email" },
    { key: "phone", label: "Phone Number", icon: Phone, type: "tel" },
  ];

  return (
    <AppLayout title="Profile">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="My Profile"
          subtitle="Manage your personal information"
          actions={
            editing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(false)}
                  disabled={savingInfo}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-[#D1D5DB] text-[#374151] bg-white hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInfo}
                  disabled={savingInfo}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {savingInfo && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            ) : (
              <button
                onClick={startEditing}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
              >
                Edit Profile
              </button>
            )
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
                <span className="font-medium text-[#374151]">{memberSince}</span>
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

              {infoError && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{infoError}</span>
                </div>
              )}
              {infoSuccess && (
                <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle size={15} className="shrink-0" />
                  <span>{infoSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {infoFields.map(({ key, label, icon: Icon, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-[#6B7280] font-medium mb-1">{label}</label>
                    {editing ? (
                      <input
                        type={type}
                        value={infoForm[key]}
                        onChange={(e) => setInfoForm({ ...infoForm, [key]: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F8FA] rounded-lg text-sm text-[#374151]">
                        <Icon size={13} className="text-[#9CA3AF]" />
                        {(user as any)?.[key] || "—"}
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
                  { label: "Team / Tag", value: user?.tag || "—" },
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

              {passwordError && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle size={15} className="shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {passwordFields.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-[#6B7280] font-medium mb-1">{label}</label>
                    <div className="relative">
                      <input
                        type={showPassword[key] ? "text" : "password"}
                        placeholder="••••••••"
                        value={passwordForm[key]}
                        onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                        className="w-full pl-3 pr-9 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword({ ...showPassword, [key]: !showPassword[key] })}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors cursor-pointer"
                        title={showPassword[key] ? "Hide password" : "Show password"}
                      >
                        {showPassword[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleUpdatePassword}
                disabled={savingPassword}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors"
              >
                {savingPassword && <Loader2 size={14} className="animate-spin" />}
                Update Password
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
