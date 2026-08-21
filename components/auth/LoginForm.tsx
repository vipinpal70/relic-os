"use client";

import { useActionState, useState } from "react";
import { Shield, Mail, Lock, ArrowRight, Loader2, Sparkles, TrendingUp, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { login } from "@/app/actions/auth";
import logo from "@/public/rws.png"
import Image from "next/image";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans">
      {/* Brand & Marketing Column */}
      <div className="relative hidden lg:flex lg:w-1/2 gradient-blue overflow-hidden flex-col justify-between p-12 text-white">
        {/* Decorative ambient blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[#60A5FA] opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#818CF8] opacity-35 blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <Image src={logo} alt="Logo" className="relative z-10" width={200} height={200} />
        {/* <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Shield className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">Relic Wealth Solutions</span>
            <p className="text-[10px] text-blue-200 tracking-wider uppercase font-semibold">Loan Management</p>
          </div>
        </div> */}

        {/* Center Pitch */}
        <div className="my-auto max-w-lg space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-blue-100">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            Enterprise CRM & Origination Suite
          </div>
          <h1 className="text-4xl lg:text-5xl font-semibold leading-tight tracking-tight">
            <em className="text-yellow-400">Streamline</em> your loan operations from lead to disbursement.
          </h1>
          <p className="text-blue-100 text-base leading-relaxed">
            Manage channel partners, track commissions, upload secure KYC documents, and monitor dashboard performance in real time.
          </p>

          {/* Bullet achievements */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-50">Secure Sessions</span>
            </div>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-50">Real-Time Sync</span>
            </div>
          </div>
        </div>

        {/* Bottom footer note */}
        <div className="text-xs text-blue-200/80 relative z-10 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Relic Wealth Solutions. All rights reserved.</span>
        </div>
      </div>

      {/* Auth Form Column */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 lg:p-20 bg-white">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2.5 text-left">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center">
                <Shield className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-[#111827]">Relic Wealth Solutions</span>
                <p className="text-[10px] text-[#9CA3AF] tracking-wider uppercase font-semibold">Loan Management</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[#111827] tracking-tight">Sign In</h2>
            <p className="text-sm text-[#6B7280]">
              Welcome back! Access your workspace and manage active files.
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="p-4 bg-red-50 border border-red-200/60 rounded-xl text-xs text-red-600 font-medium leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                {state.error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-[#374151]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9CA3AF]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-xs font-semibold text-[#374151]">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9CA3AF]" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#2563EB] text-white rounded-xl text-sm font-semibold hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:opacity-75 disabled:cursor-not-allowed shadow-md shadow-blue-100 hover:shadow-lg transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying Session...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
