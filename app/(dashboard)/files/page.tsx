"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, FileText, Image, Upload, Download, Search, ChevronRight, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";

const folderCategories = ["KYC", "Loan Application", "Other"];

export default function FilesPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState("KYC");
  const [search, setSearch] = useState("");

  // Load all leads first
  useEffect(() => {
    async function loadLeads() {
      try {
        const res = await fetch("/api/leads");
        if (res.ok) {
          const data = await res.json();
          setLeads(data);
          if (data.length > 0) {
            setSelectedLead(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load leads inside files:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, []);

  // Load documents whenever selected lead changes
  useEffect(() => {
    if (!selectedLead) {
      setDocuments([]);
      return;
    }
    async function loadDocs() {
      try {
        const res = await fetch(`/api/leads/${selectedLead._id || selectedLead.id}/documents`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
        }
      } catch (err) {
        console.error("Failed to fetch lead documents:", err);
      }
    }
    loadDocs();
  }, [selectedLead]);

  const getFolderFileCount = (folderName: string) => {
    return documents.filter((d) => d.folder === folderName).length;
  };

  const filteredFiles = documents.filter(
    (d) =>
      d.folder === selectedFolder &&
      d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="File Repository">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <PageHeader
          title="File Repository"
          subtitle="Manage all client documents"
          actions={
            <Link
              href="/leads"
              className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1D4ED8] transition-colors shadow-sm"
            >
              <Upload size={15} />
              Upload file via Leads
            </Link>
          }
        />

        {loading ? (
          <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
            <p className="text-sm text-[#474569] font-medium">Loading repository details...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-3">
              <Folder size={24} className="text-[#9CA3AF]" />
            </div>
            <p className="text-sm font-medium text-[#374151]">No leads or files found</p>
            <p className="text-xs text-[#9CA3AF] mt-1 mb-4">Create a lead or sync integration settings to list client folders</p>
            <Link href="/leads" className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
              Add New Lead
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
            {/* Tree Sidebar */}
            <div className="card p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm h-fit">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">Active Clients</p>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {leads.map((c) => {
                  const leadId = c._id || c.id;
                  const isSelected = selectedLead && (selectedLead._id === leadId || selectedLead.id === leadId);
                  return (
                    <div key={leadId}>
                      <button
                        onClick={() => {
                          setSelectedLead(c);
                          setSelectedFolder("KYC");
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs transition-all ${isSelected
                            ? "bg-[#EFF6FF] text-[#2563EB] border border-blue-100 shadow-xs"
                            : "text-[#374151] hover:bg-[#F9FAFB] border border-transparent"
                          }`}
                      >
                        <Folder size={14} className={isSelected ? "text-[#2563EB]" : "text-[#9CA3AF]"} />
                        <span className="truncate font-bold text-left flex-1">{c.applicant_name}</span>
                        <ChevronRight size={12} className={`ml-auto flex-shrink-0 transition-transform ${isSelected ? "rotate-90 text-[#2563EB]" : "text-[#9CA3AF]"}`} />
                      </button>

                      {isSelected && (
                        <div className="ml-5 mt-1.5 space-y-1 pl-1 border-l border-blue-100">
                          {folderCategories.map((f) => (
                            <button
                              key={f}
                              onClick={() => setSelectedFolder(f)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-colors font-semibold ${selectedFolder === f
                                  ? "bg-[#DBEAFE]/60 text-[#1D4ED8]"
                                  : "text-[#6B7280] hover:bg-[#F3F4F6]"
                                }`}
                            >
                              <Folder size={11} />
                              {f === "Other" ? "Other Documents" : f}
                              <span className="ml-auto text-[9px] bg-white border border-[#E5E7EB] text-[#6B7280] px-1.5 py-0.5 rounded-full font-bold">
                                {getFolderFileCount(f)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* File Grid */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search files..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-[#D1D5DB] rounded-xl text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all text-[#111827] font-medium"
                  />
                </div>
                {selectedLead && (
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-semibold bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                    <span className="text-[#111827]">{selectedLead.applicant_name}</span>
                    <ChevronRight size={11} className="text-[#9CA3AF]" />
                    <span>{selectedFolder === "Other" ? "Other Documents" : selectedFolder}</span>
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {filteredFiles.length > 0 ? (
                  <motion.div
                    key={`${selectedLead?._id}-${selectedFolder}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                  >
                    {filteredFiles.map((file, i) => {
                      const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      return (
                        <motion.div
                          key={file._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min(i * 0.05, 0.3) }}
                          className="card bg-white border border-[#E5E7EB] p-4 cursor-pointer group hover:border-blue-300 hover:shadow-md transition-all duration-200 rounded-xl"
                        >
                          <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center">
                            {isImage ? (
                              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center border border-[#E0E7FF]">
                                <Image size={18} className="text-[#6366F1]" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center border border-[#DBEAFE]">
                                <FileText size={18} className="text-[#2563EB]" />
                              </div>
                            )}
                          </div>

                          <p className="text-sm font-bold text-[#111827] truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5 font-semibold">
                            Uploaded by {file.uploadedBy || "System"} · {new Date(file.createdAt).toLocaleDateString("en-IN")}
                          </p>

                          <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {file.url && (
                              <>
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 text-center text-xs bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-lg transition-colors font-bold border border-blue-100"
                                >
                                  Preview
                                </a>
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="p-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] rounded-lg transition-colors flex items-center justify-center border border-gray-200"
                                  title="Download file"
                                >
                                  <Download size={14} className="text-[#6B7280]" />
                                </a>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card flex flex-col items-center justify-center py-16 text-center bg-white border border-[#E5E7EB] rounded-2xl shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center mb-3">
                      <Folder size={20} className="text-[#9CA3AF]" />
                    </div>
                    <p className="text-sm font-bold text-[#374151]">No files in this folder</p>
                    {selectedLead && (
                      <p className="text-xs text-[#9CA3AF] mt-1 mb-4">
                        Upload documents in the overview for {selectedLead.applicant_name} to see them here.
                      </p>
                    )}
                    {selectedLead && (
                      <Link
                        href={`/leads/${selectedLead._id || selectedLead.id}`}
                        className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                      >
                        Go to Lead Overview
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
