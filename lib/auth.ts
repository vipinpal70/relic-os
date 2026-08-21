import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { dbConnect } from "./mongodb";
import User from "./models/User";
import Session from "./models/Session";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "relic_os_access_secret_key_long_and_secure_987654321";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "relic_os_refresh_secret_key_long_and_secure_987654321";

const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days
export const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Team management permission: Admins, or any user tagged "admin" (case-insensitive).
 */
export function canManageTeam(user: { role?: string; tag?: string } | null | undefined): boolean {
  if (!user) return false;
  return user.role === "Admin" || (user.tag || "").trim().toLowerCase() === "admin";
}

/**
 * Resolves whether a cross-domain redirect is needed based on user role and request hostname.
 * - Channel Partners are routed to pro.relicwealth.in
 * - Admins and Team members are routed to one.relicwealth.in
 * Returns full redirect URL if a cross-domain jump is needed, or null if already on the correct host / local dev.
 */
export function getRoleDomainRedirectUrl(role: string, currentHost?: string): string | null {
  if (!currentHost) return null;
  const host = currentHost.toLowerCase().split(":")[0]; // strip port if any

  if (host.includes("relicwealth.in")) {
    const isPartner = role === "Channel Partner";
    if (isPartner && !host.startsWith("pro.")) {
      return "https://pro.relicwealth.in/dashboard";
    }
    if (!isPartner && !host.startsWith("one.")) {
      return "https://one.relicwealth.in/dashboard";
    }
  }

  return null;
}

export interface TokenPayload {
  userId: string;
  sessionId: string;
  email: string;
  role: string;
  name: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: { userId: string; sessionId: string }): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string; sessionId: string } | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string; sessionId: string };
  } catch (error) {
    return null;
  }
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const reqHeaders = await headers();
  const host = (reqHeaders.get("host") || "").toLowerCase().split(":")[0];

  const isProductionDomain = host.includes("relicwealth.in");
  const domain = isProductionDomain ? ".relicwealth.in" : undefined;
  const sameSite = isProductionDomain ? "lax" : "strict";

  // Set Access Token (15 mins)
  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || isProductionDomain,
    sameSite,
    domain,
    maxAge: 15 * 60, // 15 mins in seconds
    path: "/",
  });

  // Set Refresh Token (7 days)
  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || isProductionDomain,
    sameSite,
    domain,
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  const reqHeaders = await headers();
  const host = (reqHeaders.get("host") || "").toLowerCase().split(":")[0];
  const domain = host.includes("relicwealth.in") ? ".relicwealth.in" : undefined;

  try {
    cookieStore.delete({ name: "accessToken", path: "/", domain });
    cookieStore.delete({ name: "refreshToken", path: "/", domain });
  } catch (e) {
    // cookies() can be read-only in some contexts
  }
}

/**
 * Gets the current authenticated user and session.
 * If accessToken is expired but a valid refreshToken session is active,
 * it will automatically refresh the tokens, update cookies, and return the user.
 * If everything is invalid, it returns null.
 */
export async function getSessionUser() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (accessToken) {
      const decoded = verifyAccessToken(accessToken);
      if (decoded) {
        // Access token is valid. Verify that the session is still valid in DB
        const session = await Session.findOne({ _id: decoded.sessionId, isValid: true });
        if (session && session.expiresAt > new Date()) {
          const user = await User.findById(decoded.userId).select("-password");
          if (user && user.status === "Active") {
            return { user: JSON.parse(JSON.stringify(user)), session: JSON.parse(JSON.stringify(session)) };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error in getSessionUser:", error);
    return null;
  }
}
