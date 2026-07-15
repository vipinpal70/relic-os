"use client";

import { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Phone, Mail, FileText, Clock, Upload,
  CheckCircle, Loader2, Edit3, CheckCircle2, AlertCircle,
  Plus, MessageSquare, DollarSign, Activity, FileCheck, Download
} from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

const tabs = ["Overview", "Documents", "Timeline"];

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // States
  const [activeTab, setActiveTab] = useState("Overview");
  const [lead, setLead] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-resource states
  const [activities, setActivities] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [commission, setCommission] = useState<any | null>(null);

  // Modal control states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Form edit states
  const [editForm, setEditForm] = useState({
    applicant_name: "",
    email: "",
    phone: "",
    loan_amount: 0,
    loan_type: "Home Loan",
    bank: "",
    channel_partner: "",
    assigned_user: "",
    remarks: "",
  });

  const [statusForm, setStatusForm] = useState({
    status: "New",
    remarks: "",
  });

  const [uploadForm, setUploadForm] = useState({
    name: "",
    folder: "KYC" as "KYC" | "Bank Documents" | "Financial Documents" | "Property Documents" | "Other",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Auto-suggestion lists for bank/partner matching commissions configuration
  const [existingBanks, setExistingBanks] = useState<string[]>([]);
  const [existingPartners, setExistingPartners] = useState<string[]>([]);
  const [isOtherBank, setIsOtherBank] = useState(false);
  const [isOtherPartner, setIsOtherPartner] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const [commissionForm, setCommissionForm] = useState({
    payoutRate: 1.5,
    commissionType: "Bank",
    status: "Unpaid",
  });

  const [commentInput, setCommentInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Data loading triggers
  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error("Lead could not be found.");
      const data = await res.json();
      setLead(data);
      setEditForm({
        applicant_name: data.applicant_name,
        email: data.email,
        phone: data.phone,
        loan_amount: data.loan_amount,
        loan_type: data.loan_type,
        bank: data.bank || "",
        channel_partner: data.channel_partner || "",
        assigned_user: data.assigned_user || "",
        remarks: data.remarks || "",
      });
      setStatusForm({
        status: data.status,
        remarks: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load lead.");
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/leads/${id}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/leads/${id}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCommission = async () => {
    try {
      const res = await fetch(`/api/leads/${id}/commissions`);
      if (res.ok) {
        const data = await res.json();
        setCommission(data);
        setCommissionForm({
          payoutRate: data.payoutRate,
          commissionType: data.commissionType,
          status: data.status,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCommissionsData = async () => {
    try {
      const banksRes = await fetch("/api/banks?limit=100");
      if (banksRes.ok) {
        const banksData = await banksRes.json();
        if (banksData && banksData.data) {
          const list = banksData.data.map((b: any) => b.bankName).filter(Boolean);
          setExistingBanks(Array.from(new Set(list)).sort() as string[]);
        }
      }

      const cpRes = await fetch("/api/channel-partners?limit=100");
      if (cpRes.ok) {
        const cpData = await cpRes.json();
        if (cpData && cpData.data) {
          const list = cpData.data.map((p: any) => p.companyName || p.name).filter(Boolean);
          setExistingPartners(Array.from(new Set(list)).sort() as string[]);
        }
      }
    } catch (err) {
      console.error("Failed to load drop-down suggestion lists:", err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await fetchLead();
    await fetchActivities();
    await fetchDocuments();
    await fetchCommission();
    await fetchCommissionsData();
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [id]);

  // Actions
  const openEditModal = () => {
    setEditForm({
      applicant_name: lead.applicant_name,
      email: lead.email,
      phone: lead.phone,
      loan_amount: lead.loan_amount,
      loan_type: lead.loan_type,
      bank: lead.bank || "",
      channel_partner: lead.channel_partner || "",
      assigned_user: lead.assigned_user || "",
      remarks: lead.remarks || "",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setIsEditOpen(false);
        await fetchLead();
        await fetchActivities();
      } else {
        alert("Failed to update lead details.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusForm),
      });
      if (res.ok) {
        setIsStatusOpen(false);
        await fetchLead();
        await fetchActivities();
        await fetchCommission(); // status changes can update payout base values
      } else {
        alert("Failed to transition status.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select or drop a file to upload.");
      return;
    }
    setSaving(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("folder", uploadForm.folder);

    try {
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(percent);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve(xhr.responseText);
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || "Failed to upload document."));
            } catch {
              reject(new Error("Failed to upload document."));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during file upload.")));
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted.")));

        xhr.open("POST", `/api/leads/${id}/documents`);
        xhr.send(formData);
      });

      await uploadPromise;

      setSelectedFile(null);
      setUploadForm({ name: "", folder: "KYC" as any });
      setIsUploadOpen(false);
      await fetchDocuments();
      await fetchActivities();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during file upload.");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const handleCommissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}/commissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commissionForm),
      });
      if (res.ok) {
        await fetchCommission();
        await fetchActivities();
        alert("Commission settings updated successfully.");
      } else {
        alert("Failed to save commission rates.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "Remarks Added",
          remarks: commentInput,
        }),
      });
      if (res.ok) {
        setCommentInput("");
        await fetchActivities();
      } else {
        alert("Failed to publish timeline comment.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Lead Details">
        <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
          <p className="text-sm text-[#474569] font-medium">Loading interactive details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !lead) {
    return (
      <AppLayout title="Error">
        <div className="card p-8 flex flex-col items-center gap-4 text-center max-w-md mx-auto mt-12 border-red-100 bg-red-50/50">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-bold text-red-600">Error: {error || "Lead details not found."}</p>
          <Link href="/leads" className="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
            Back to Leads
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Filter documents by folders
  const getDocsInFolder = (folderName: string) => {
    return documents.filter((d) => d.folder === folderName);
  };

  return (
    <AppLayout title={`Lead: ${lead.applicant_name}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Back */}
        <Link href="/leads" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#2563EB] mb-4 transition-colors">
          <ArrowLeft size={15} />
          Back to Leads
        </Link>

        {/* Header card */}
        <div className="card p-5 mb-4 flex flex-wrap items-start justify-between gap-4 bg-white shadow-sm border border-[#E5E7EB] rounded-xl">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-xl font-bold text-[#111827]">{lead.applicant_name}</h1>
              <StatusBadge status={lead.status} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280]">
              <span className="flex items-center gap-1.5 font-medium"><Phone size={13} />{lead.phone}</span>
              <span className="flex items-center gap-1.5 font-medium"><Mail size={13} />{lead.email}</span>
              <span className="font-mono text-xs bg-[#F3F4F6] text-[#4B5563] px-2.5 py-0.5 rounded-lg border border-[#E5E7EB]">
                {lead.application_number}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openEditModal}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-[#D1D5DB] bg-white rounded-xl text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB] active:scale-95 transition-all shadow-sm"
            >
              <Edit3 size={14} />
              Edit details
            </button>
            <button
              onClick={() => setIsStatusOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-bold hover:bg-[#1D4ED8] active:scale-95 transition-all shadow-sm"
            >
              <CheckCircle size={14} />
              Update Status
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-5 border-b border-[#E5E7EB]">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${t === activeTab
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-[#6B7280] hover:text-[#374151]"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content Rendering */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "Overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Applicant Details */}
                <div className="card p-5 bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-4.5 rounded-full bg-blue-500 inline-block"></span>
                    Applicant Details
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Full Name", value: lead.applicant_name },
                      { label: "Email", value: lead.email },
                      { label: "Phone", value: lead.phone },
                      { label: "Lead Source", value: lead.lead_source },
                      { label: "Channel Partner", value: lead.channel_partner || "—" },
                      { label: "Assigned RM", value: lead.assigned_user || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0 text-sm">
                        <span className="text-xs font-semibold text-[#6B7280]">{label}</span>
                        <span className="font-bold text-[#111827]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Loan Details */}
                <div className="card p-5 bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-4.5 rounded-full bg-emerald-500 inline-block"></span>
                    Loan Details
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Loan Type", value: lead.loan_type },
                      { label: "Bank", value: lead.bank || "—" },
                      { label: "Requested Amount", value: formatCurrency(lead.loan_amount) },
                      { label: "Disbursed Amount", value: lead.disbursed_amount ? formatCurrency(lead.disbursed_amount) : "—" },
                      { label: "Approved Date", value: lead.approved_date ? formatDate(lead.approved_date) : "—" },
                      { label: "Disbursed Date", value: lead.disbursed_date ? formatDate(lead.disbursed_date) : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-[#F3F4F6] last:border-0 text-sm">
                        <span className="text-xs font-semibold text-[#6B7280]">{label}</span>
                        <span className="font-bold text-[#111827]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {lead.remarks && (
                  <div className="lg:col-span-2 card p-5 bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold text-[#111827] mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-4.5 rounded-full bg-indigo-500 inline-block"></span>
                      Remarks / Notes
                    </h3>
                    <p className="text-sm text-[#4B5563] leading-relaxed font-medium">{lead.remarks}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Documents" && (
              <div className="card p-5 bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">Categorized Documents</h3>
                    <p className="text-xs text-[#6B7280]">Files uploaded for lead verification</p>
                  </div>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] transition-colors shadow-sm"
                  >
                    <Plus size={13} />
                    Upload document
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {["KYC", "Bank Documents", "Financial Documents", "Property Documents", "Other"].map((folderName) => {
                    const files = getDocsInFolder(folderName);
                    return (
                      <div key={folderName} className="border border-[#E5E7EB] rounded-2xl p-4 bg-[#F9FAFB]/50 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-2 mb-3.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
                            <FileText size={15} />
                          </div>
                          <span className="text-sm font-bold text-[#111827]">{folderName}</span>
                        </div>
                        {files.length > 0 ? (
                          <ul className="space-y-2.5">
                            {files.map((file) => (
                              <li key={file._id} className="flex items-start justify-between gap-2 text-xs text-[#374151] p-2 bg-white border border-[#E5E7EB] rounded-xl shadow-2xs group/item">
                                <div className="flex gap-2 overflow-hidden">
                                  <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <div className="overflow-hidden">
                                    <p className="font-semibold truncate text-[#111827]" title={file.name}>{file.name}</p>
                                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">By {file.uploadedBy} · {new Date(file.createdAt).toLocaleDateString("en-IN")}</p>
                                  </div>
                                </div>
                                {file.url && (
                                  <a
                                    href={file.url}
                                    download={file.name}
                                    className="p-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-lg transition-colors ml-auto flex-shrink-0 flex items-center justify-center"
                                    title="Download document"
                                  >
                                    <Download size={12} className="text-[#6B7280]" />
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-[#9CA3AF] py-4 text-center font-medium">No files uploaded</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "Timeline" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Timeline Tree */}
                <div className="lg:col-span-2 card p-5 bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold text-[#111827] mb-5 flex items-center gap-2">
                    <Activity size={15} className="text-blue-500" />
                    Timeline Audit Logs
                  </h3>

                  <div className="relative pl-6 space-y-5">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#E5E7EB]" />
                    {activities.map((act) => (
                      <div key={act._id} className="relative">
                        <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${act.action === "Status Updated" ? "bg-emerald-500" :
                          act.action === "Document Uploaded" ? "bg-blue-500" :
                            act.action === "Commission Updated" ? "bg-purple-500" :
                              act.action === "Bank Updated" ? "bg-amber-500" :
                                act.action === "RM Assigned" ? "bg-teal-500" :
                                  act.action === "Loan Amount Updated" || act.action === "Loan Type Updated" ? "bg-orange-500" :
                                    act.action === "Remarks Added" ? "bg-rose-500" : "bg-slate-500"
                          }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#111827]">{act.action}</span>
                            {act.new_value && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold border border-blue-100">
                                {act.new_value}
                              </span>
                            )}
                          </div>
                          {act.remarks && <p className="text-xs text-[#4B5563] font-medium mt-1">{act.remarks}</p>}
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#9CA3AF] font-semibold">
                            <span>Author: {act.user}</span>
                            <span>•</span>
                            <span>{new Date(act.created_at || act.createdAt).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add timeline comment */}
                <div className="card p-5 bg-white border border-[#E5E7EB] rounded-xl shadow-sm h-fit">
                  <h3 className="text-sm font-bold text-[#111827] mb-3 flex items-center gap-2">
                    <MessageSquare size={14} className="text-blue-500" />
                    Add remarks
                  </h3>
                  <form onSubmit={handleAddComment} className="space-y-3">
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Type a log comment or manual note..."
                      className="w-full min-h-[90px] px-3.5 py-2.5 border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-[#111827] bg-white placeholder-[#9CA3AF] font-medium"
                      required
                    />
                    <button
                      type="submit"
                      disabled={saving || !commentInput.trim()}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all shadow-sm"
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Publish comment
                    </button>
                  </form>
                </div>
              </div>
            )}


          </motion.div>
        </AnimatePresence>

        {/* MODALS */}

        {/* 1. EDIT LEAD MODAL */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-[#E5E7EB] w-full max-w-xl rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-[#F3F4F6] flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#111827]">Edit Lead Specifications</h3>
                <button onClick={() => setIsEditOpen(false)} className="text-xs text-[#9CA3AF] hover:text-[#374151] font-semibold">Cancel</button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[#374151]">Applicant Full Name</label>
                    <input
                      type="text"
                      value={editForm.applicant_name}
                      onChange={(e) => setEditForm({ ...editForm, applicant_name: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm text-[#111827]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#374151]">Email ID</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm text-[#111827]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#374151]">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm text-[#111827]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#374151]">Loan Type</label>
                    <select
                      value={editForm.loan_type}
                      onChange={(e) => setEditForm({ ...editForm, loan_type: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm text-[#111827] bg-white cursor-pointer"
                    >
                      <option value="Home Loan">Home Loan</option>
                      <option value="Business Loan">Business Loan</option>
                      <option value="Personal Loan">Personal Loan</option>
                      <option value="Car Loan">Car Loan</option>
                      <option value="Education Loan">Education Loan</option>
                      <option value="Mortgage Loan">Mortgage Loan</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#374151]">Requested Loan Amount (INR)</label>
                    <input
                      type="number"
                      value={editForm.loan_amount}
                      onChange={(e) => setEditForm({ ...editForm, loan_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm text-[#111827]"
                      required
                    />
                  </div>

                  {/* Bank Name Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[#374151]">Bank Name</label>
                    <select
                      value={editForm.bank}
                      onChange={(e) => setEditForm({ ...editForm, bank: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-sm text-[#111827] bg-white cursor-pointer"
                      required
                    >
                      <option value="" disabled>-- Select Bank --</option>
                      {existingBanks.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Channel Partner Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[#374151]">Channel Partner</label>
                    <select
                      value={editForm.channel_partner}
                      onChange={(e) => setEditForm({ ...editForm, channel_partner: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-sm text-[#111827] bg-white cursor-pointer"
                    >
                      <option value="">-- Direct (No Partner) --</option>
                      {existingPartners.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#374151]">Assigned RM</label>
                    <input
                      type="text"
                      value={editForm.assigned_user}
                      onChange={(e) => setEditForm({ ...editForm, assigned_user: e.target.value })}
                      placeholder="e.g. Amit Singh"
                      className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm text-[#111827]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#374151]">General Remarks</label>
                  <textarea
                    value={editForm.remarks}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                    className="w-full min-h-[60px] px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm text-[#111827]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#F3F4F6]">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 border border-[#CBD5E1] text-[#374151] rounded-xl hover:bg-gray-50 font-bold active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    {saving && <Loader2 size={12} className="animate-spin" />}
                    Save changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 2. UPDATE STATUS MODAL */}
        {isStatusOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-[#E5E7EB] w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-[#F3F4F6] flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#111827]">Transition Lead Status</h3>
                <button onClick={() => setIsStatusOpen(false)} className="text-xs text-[#9CA3AF] hover:text-[#374151] font-semibold">Cancel</button>
              </div>

              <form onSubmit={handleStatusSubmit} className="p-5 space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[#374151]">New Status Level</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm text-[#111827] bg-white cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Not Connected">Not Connected</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Document Pending">Document Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Disbursed">Disbursed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#374151]">Audit Remarks / Notes</label>
                  <textarea
                    value={statusForm.remarks}
                    onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })}
                    placeholder="Describe reason for transition (e.g. CIBIL check done, ready for payment)..."
                    className="w-full min-h-[80px] px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm text-[#111827]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#F3F4F6]">
                  <button
                    type="button"
                    onClick={() => setIsStatusOpen(false)}
                    className="px-4 py-2 border border-[#CBD5E1] text-[#374151] rounded-xl hover:bg-gray-50 font-bold active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    {saving && <Loader2 size={12} className="animate-spin" />}
                    Confirm transition
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* 3. UPLOAD FILE MODAL */}
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-[#E5E7EB] w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-[#F3F4F6] flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#111827]">Upload Document Information</h3>
                <button onClick={() => setIsUploadOpen(false)} className="text-xs text-[#9CA3AF] hover:text-[#374151] font-semibold">Cancel</button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs font-semibold">
                <div className="space-y-3">
                  <label className="text-[#374151] block">Document File</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] relative ${dragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-300 hover:border-blue-400 bg-gray-50/30"
                      }`}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="file-upload-input"
                    />

                    {selectedFile ? (
                      <div className="space-y-1.5">
                        <FileCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-bold text-sm text-[#111827] truncate max-w-[280px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-[#6B7280]">{(selectedFile.size / 1024).toFixed(1)} KB · Click or drag to change file</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Upload className="w-8 h-8 text-[#9CA3AF] mx-auto mb-1" />
                        <p className="font-bold text-sm text-[#374151]">Drag & drop file here</p>
                        <p className="text-[10px] text-[#6B7280]">or click to select from explorer</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[#374151]">Category Folder</label>
                  <select
                    value={uploadForm.folder}
                    onChange={(e) => setUploadForm({ ...uploadForm, folder: e.target.value as any })}
                    disabled={saving || uploadProgress !== null}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl focus:outline-none focus:border-blue-500 font-medium text-sm text-[#111827] bg-white cursor-pointer disabled:opacity-60"
                  >
                    <option value="KYC">KYC</option>
                    <option value="Bank Documents">Bank Documents</option>
                    <option value="Financial Documents">Financial Documents</option>
                    <option value="Property Documents">Property Documents</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {uploadProgress !== null && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-[#2563EB] font-bold">
                      <span>Uploading document file...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-[#EFF6FF] rounded-full h-2.5 overflow-hidden border border-blue-100">
                      <div
                        className="bg-[#2563EB] h-full rounded-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-[#F3F4F6]">
                  <button
                    type="button"
                    disabled={saving || uploadProgress !== null}
                    onClick={() => {
                      setSelectedFile(null);
                      setIsUploadOpen(false);
                    }}
                    className="px-4 py-2 border border-[#CBD5E1] text-[#374151] rounded-xl hover:bg-gray-50 font-bold disabled:opacity-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadProgress !== null || !selectedFile}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all"
                  >
                    {saving || uploadProgress !== null ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload file"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
