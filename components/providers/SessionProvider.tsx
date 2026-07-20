"use client";

import React, { createContext, useContext } from "react";

export interface SessionUser {
  _id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Manager" | "Employee" | "Team" | "Channel Partner";
  phone?: string;
  status: "Active" | "Inactive";
  tag?: string;
  assigned_partner?: string;
}

interface SessionData {
  _id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
}

interface SessionContextType {
  user: SessionUser;
  session: SessionData;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SessionContextType;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
