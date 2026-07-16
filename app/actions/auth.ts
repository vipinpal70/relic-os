"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Session from "@/lib/models/Session";
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  SESSION_EXPIRY_MS,
  TokenPayload,
} from "@/lib/auth";

// Automatically seed mock users if DB is empty so that the application works out of the box
async function seedUsersIfNeeded() {
  await dbConnect();
  const count = await User.countDocuments();
  if (count === 0) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const mockUsers = [
      { name: "Vikash Sharma", email: "vikash@relicos.com", phone: "9111111111", role: "Admin", status: "Active", tag: "Super Admin", password: hashedPassword },
      { name: "Priya Nair", email: "priya@relicos.com", phone: "9222222222", role: "Team", status: "Active", tag: "Senior RM", assigned_partner: "", password: hashedPassword },
      { name: "Amit Singh", email: "amit@relicos.com", phone: "9333333333", role: "Team", status: "Active", tag: "RM", assigned_partner: "", password: hashedPassword },
      { name: "Rahul Verma", email: "rahul@relicos.com", phone: "9444444444", role: "Team", status: "Active", tag: "RM", assigned_partner: "", password: hashedPassword },
    ];
    await User.insertMany(mockUsers);
    console.log("Mock users seeded successfully.");
  }
}

export async function login(prevState: any, formData: FormData) {
  try {
    await dbConnect();
    await seedUsersIfNeeded();

    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return { error: "Please enter both email and password." };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { error: "Invalid email or password." };
    }

    if (user.status !== "Active") {
      return { error: "Your account is deactivated. Please contact support." };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { error: "Invalid email or password." };
    }

    // Get client info
    const headersList = await import("next/headers");
    const userAgent = (await headersList.headers()).get("user-agent") || "unknown";
    const ipAddress = (await headersList.headers()).get("x-forwarded-for") || "unknown";

    // Create session in DB
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
    const session = new Session({
      userId: user._id,
      refreshToken: "temp", // updated below
      userAgent,
      ipAddress,
      expiresAt,
    });
    await session.save();

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      sessionId: session._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      sessionId: session._id.toString(),
    });

    // Save refresh token back to session
    session.refreshToken = refreshToken;
    await session.save();

    // Set HTTP-only cookies
    await setAuthCookies(accessToken, refreshToken);

  } catch (error: any) {
    console.error("Login action error:", error);
    return { error: error.message || "An unexpected error occurred during login." };
  }

  // Redirect to dashboard on success
  redirect("/dashboard");
}

export async function register(prevState: any, formData: FormData) {
  try {
    await dbConnect();
    await seedUsersIfNeeded();

    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();
    const role = formData.get("role")?.toString() || "Team";

    if (!name || !email || !password) {
      return { error: "All fields (name, email, password) are required." };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long." };
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      status: "Active",
    });
    await newUser.save();

  } catch (error: any) {
    console.error("Registration action error:", error);
    return { error: error.message || "An unexpected error occurred during registration." };
  }

  redirect("/login");
}

export async function logout() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (refreshToken) {
      const decoded = jwt.decode(refreshToken) as { sessionId?: string };
      if (decoded && decoded.sessionId) {
        // Invalidate session in DB
        await Session.updateOne({ _id: decoded.sessionId }, { isValid: false });
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    await clearAuthCookies();
    redirect("/login");
  }
}
