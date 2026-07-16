import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  try {
    await dbConnect();

    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, currentPassword, newPassword } = body;

    // Re-fetch with password hash for verification and saving
    const user = await User.findById(session.user._id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Password change requires verifying the current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Personal info updates
    if (name !== undefined) {
      if (!String(name).trim()) {
        return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
      }
      user.name = String(name).trim();
    }

    if (email !== undefined) {
      const emailLower = String(email).trim().toLowerCase();
      if (!/\S+@\S+\.\S+/.test(emailLower)) {
        return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
      }
      if (emailLower !== user.email) {
        const emailExists = await User.findOne({ email: emailLower, _id: { $ne: user._id } });
        if (emailExists) {
          return NextResponse.json({ error: "Email is already taken by another user." }, { status: 400 });
        }
        user.email = emailLower;
      }
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;

    return NextResponse.json({ message: "Profile updated successfully", user: sanitized });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
