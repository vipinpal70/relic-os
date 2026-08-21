"use client";
import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLoanTypes } from "@/lib/hooks/useLoanTypes";
import { Plus, Search, Loader2, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoanTypesPage() {
  const { loanTypes, isLoading, createLoanType, isCreating, updateLoanType } = useLoanTypes();
  const [searchTerm, setSearchTerm] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredTypes = loanTypes.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = async (id: string, currentStatus: "Active" | "Inactive") => {
    try {
      const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await updateLoanType({ id, status: nextStatus });
    } catch (err: any) {
      alert(err.message || "Failed to update loan type status");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    setErrorMsg("");
    try {
      await createLoanType(newTypeName);
      setNewTypeName("");
      setShowModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create loan type");
    }
  };

  return (
    <AppLayout title="Loan Types">
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Loan Products & Schemes</h1>
            <p className="text-sm text-[#6B7280]">Configure products offered by lenders and handled by partners.</p>
          </div>
          <button
            onClick={() => {
              setErrorMsg("");
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow"
          >
            <Plus size={18} />
            <span>Add Loan Type</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="card p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search loan types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] bg-white transition-all"
            />
          </div>
          <div className="text-xs text-[#6B7280]">
            Total configured products: <span className="font-semibold text-[#111827]">{loanTypes.length}</span>
          </div>
        </div>

        {/* Content list */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTypes.map((type, idx) => {
              const active = type.status === "Active";
              return (
                <motion.div
                  key={type._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`card p-5 relative flex flex-col justify-between overflow-hidden border transition-all ${
                    active ? "border-[#ECEEF2] hover:border-blue-200" : "bg-gray-50 border-gray-200 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-xl ${active ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-gray-200 text-gray-400"}`}>
                      <Landmark size={20} />
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {type.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-bold text-base text-[#111827] truncate" title={type.name}>
                      {type.name}
                    </h3>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      Created: {new Date(type.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#ECEEF2] flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6B7280]">Status</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={active}
                      onClick={() => handleToggleStatus(type._id, type.status)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        active ? "bg-green-500" : "bg-[#D1D5DB]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {filteredTypes.length === 0 && (
              <div className="col-span-full card p-8 text-center text-[#9CA3AF]">
                <p className="text-sm font-medium">No loan types match your search criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              />

              {/* Dialog body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10 relative overflow-hidden border border-[#E5E7EB]"
              >
                <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                  <Landmark className="text-[#2563EB] w-5 h-5" />
                  <span>Create New Loan Product</span>
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Configure a custom product category for CRM integration.
                </p>

                <form onSubmit={handleCreate} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Home Loan, Business Loan..."
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  {errorMsg && <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm text-[#4B5563] hover:bg-gray-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-2 text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      {isCreating && <Loader2 size={14} className="animate-spin" />}
                      <span>Add Product</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
