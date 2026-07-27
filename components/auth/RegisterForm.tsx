"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Shield, User, Mail, Lock, UserCog, ArrowRight, Loader2, Sparkles, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { register } from "@/app/actions/auth";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans">
      {/* Brand Column */}
      <div className="relative hidden lg:flex lg:w-1/2 gradient-indigo overflow-hidden flex-col justify-between p-12 text-white">
        {/* Ambient background decoration */}
        <div className="absolute top-[-25%] left-[-20%] w-[90%] h-[90%] rounded-full bg-[#818CF8] opacity-25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#C7D2FE] opacity-20 blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Shield className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">Relic One</span>
            <p className="text-[10px] text-indigo-200 tracking-wider uppercase font-semibold">Loan Management</p>
          </div>
        </div>

        {/* Pitch Content */}
        <div className="my-auto max-w-lg space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Empowering Loan Origination & CRM
          </div>
          <h1 className="text-4xl lg:text-5xl font-semibold leading-tight tracking-tight">
            Start managing your loan pipelines smarter.
          </h1>
          <p className="text-indigo-100 text-base leading-relaxed">
            Create an administrator or team account to access our complete dashboard suite, upload files securely, and handle lead distributions in minutes.
          </p>
        </div>

        {/* Footer */}
        <div className="text-xs text-indigo-200/80 relative z-10 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Relic OS. All rights reserved.</span>
        </div>
      </div>

      {/* Register Form Column */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 lg:p-20 bg-white">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2.5 text-left">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center">
                <Shield className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-[#111827]">Relic OS</span>
                <p className="text-[10px] text-[#9CA3AF] tracking-wider uppercase font-semibold">Loan Management</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[#111827] tracking-tight">Create Account</h2>
            <p className="text-sm text-[#6B7280]">
              Create an account to gain dashboard access and set up your loan workflows.
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="p-4 bg-red-50 border border-red-200/60 rounded-xl text-xs text-red-600 font-medium leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                {state.error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-semibold text-[#374151]">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9CA3AF]" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Your Full Name"
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                />
              </div>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-[#374151]">
                  Password
                </label>
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

              <div className="space-y-1.5">
                <label htmlFor="role" className="block text-xs font-semibold text-[#374151]">
                  Account Role
                </label>
                <div className="relative">
                  <UserCog className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#9CA3AF] pointer-events-none" />
                  <select
                    id="role"
                    name="role"
                    required
                    className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Team">Team (Relationship Manager)</option>
                    <option value="Channel Partner">Channel Partner (Agent)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-semibold active:bg-[#3730A3] disabled:opacity-75 disabled:cursor-not-allowed shadow-md shadow-indigo-100 hover:shadow-lg transition-all pt-2.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Secure Session...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer toggle */}
          <p className="text-center text-sm text-[#6B7280]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#4F46E5] hover:underline hover:text-[#4338CA] transition-colors">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
