import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import User from "@/lib/models/User";
import ChannelPartner from "@/lib/models/ChannelPartner";
import bcrypt from "bcryptjs";

// GET — fetch linked user credentials (email only, no password)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin"]);
    if (authResult instanceof NextResponse) return authResult;

    const partner = await ChannelPartner.findById(id);
    if (!partner) {
      return NextResponse.json({ error: "Channel partner not found" }, { status: 404 });
    }

    if (!partner.userId) {
      return NextResponse.json({ hasLogin: false, email: null });
    }

    const user = await User.findById(partner.userId).select("-password");
    if (!user) {
      return NextResponse.json({ hasLogin: false, email: null });
    }

    return NextResponse.json({
      hasLogin: true,
      userId: user._id,
      email: user.email,
      status: user.status,
      name: user.name,
    });
  } catch (error: any) {
    console.error("Error fetching channel partner credentials:", error);
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
  }
}

// POST — create a new login for this channel partner
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin"]);
    if (authResult instanceof NextResponse) return authResult;

    const partner = await ChannelPartner.findById(id);
    if (!partner) {
      return NextResponse.json({ error: "Channel partner not found" }, { status: 404 });
    }

    if (partner.userId) {
      return NextResponse.json({ error: "This channel partner already has a login account." }, { status: 400 });
    }

    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: partner.name,
      email: email.toLowerCase(),
      password: hashed,
      role: "Channel Partner",
      phone: partner.phone,
      status: partner.status,
    });

    partner.userId = newUser._id;
    await partner.save();

    return NextResponse.json({ success: true, userId: newUser._id, email: newUser.email }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating channel partner credentials:", error);
    return NextResponse.json({ error: error.message || "Failed to create credentials" }, { status: 500 });
  }
}

// PATCH — update email or reset password for the linked user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin"]);
    if (authResult instanceof NextResponse) return authResult;

    const partner = await ChannelPartner.findById(id);
    if (!partner || !partner.userId) {
      return NextResponse.json({ error: "No login account linked to this partner." }, { status: 404 });
    }

    const user = await User.findById(partner.userId);
    if (!user) {
      return NextResponse.json({ error: "Linked user account not found." }, { status: 404 });
    }

    const { email, password } = await request.json();

    if (email && email.toLowerCase() !== user.email) {
      const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (taken) {
        return NextResponse.json({ error: "This email is already in use by another account." }, { status: 400 });
      }
      user.email = email.toLowerCase();
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return NextResponse.json({ success: true, email: user.email });
  } catch (error: any) {
    console.error("Error updating channel partner credentials:", error);
    return NextResponse.json({ error: error.message || "Failed to update credentials" }, { status: 500 });
  }
}
