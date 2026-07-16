import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import TeamProfile from "@/lib/models/TeamProfile";
import ChannelPartner from "@/lib/models/ChannelPartner";
import bcrypt from "bcryptjs";
import { getSessionUser, canManageTeam } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const session = await getSessionUser();
    if (!session || !canManageTeam(session.user)) {
      return NextResponse.json({ error: "Access denied. Only Admins or users tagged 'admin' can manage the team." }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      phone,
      status,
      tag,
      assigned_partner,
      // Team profile fields
      employeeId,
      department,
      designation,
      reportingManagerId,
      pan,
      aadhaar,
      bankAccountNumber,
      bankIfsc,
      // Channel partner profile fields
      companyName,
      alternativePhone,
      address,
      state,
      city,
      gst,
      notes,
    } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Update credentials fields
    if (name) user.name = name;
    if (email) {
      const emailLower = email.toLowerCase();
      if (emailLower !== user.email) {
        const emailExists = await User.findOne({ email: emailLower, _id: { $ne: id } });
        if (emailExists) {
          return NextResponse.json({ error: "Email is already taken by another user" }, { status: 400 });
        }
        user.email = emailLower;
      }
    }
    if (phone) user.phone = phone;
    if (status) user.status = status;
    if (tag !== undefined) user.tag = tag;
    if (assigned_partner !== undefined) user.assigned_partner = assigned_partner;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // If role changed, we need to handle profile transitions
    const oldRole = user.role;
    if (role && role !== oldRole) {
      user.role = role;
    }

    await user.save();

    // 2. Update profile fields
    const currentRole = user.role;
    if (currentRole === "Channel Partner") {
      // Find or create ChannelPartner profile
      let cp = await ChannelPartner.findOne({ userId: user._id, isDeleted: false });
      if (!cp) {
        cp = await ChannelPartner.create({
          userId: user._id,
          name: user.name,
          companyName: companyName || user.name,
          email: user.email,
          phone: user.phone || "0000000000",
          alternativePhone,
          address,
          state,
          city,
          gst,
          pan,
          status: user.status,
          notes,
          commissionTable: [],
          createdBy: session.user.name,
          updatedBy: session.user.name,
        });
      } else {
        if (companyName) cp.companyName = companyName;
        if (alternativePhone !== undefined) cp.alternativePhone = alternativePhone;
        if (address !== undefined) cp.address = address;
        if (state !== undefined) cp.state = state;
        if (city !== undefined) cp.city = city;
        if (gst !== undefined) cp.gst = gst;
        if (pan !== undefined) cp.pan = pan;
        if (notes !== undefined) cp.notes = notes;
        cp.name = user.name;
        cp.email = user.email;
        cp.phone = user.phone || cp.phone;
        cp.status = user.status;
        cp.updatedBy = session.user.name;
        await cp.save();
      }
    } else {
      // Find or create TeamProfile
      let tp = await TeamProfile.findOne({ userId: user._id, isDeleted: false });
      if (!tp) {
        tp = await TeamProfile.create({
          userId: user._id,
          employeeId: employeeId || `EMP-${Date.now().toString().slice(-4)}`,
          department: department || "Sales",
          designation: designation || (currentRole === "Admin" ? "Admin" : "Relationship Manager"),
          reportingManagerId: reportingManagerId || null,
          pan,
          aadhaar,
          bankAccountNumber,
          bankIfsc,
        });
      } else {
        if (employeeId) tp.employeeId = employeeId;
        if (department) tp.department = department;
        if (designation) tp.designation = designation;
        if (reportingManagerId !== undefined) tp.reportingManagerId = reportingManagerId || null;
        if (pan !== undefined) tp.pan = pan;
        if (aadhaar !== undefined) tp.aadhaar = aadhaar;
        if (bankAccountNumber !== undefined) tp.bankAccountNumber = bankAccountNumber;
        if (bankIfsc !== undefined) tp.bankIfsc = bankIfsc;
        await tp.save();
      }
    }

    return NextResponse.json({ message: "User and profile updated successfully" });
  } catch (error: any) {
    console.error("Error updating team user:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const session = await getSessionUser();
    if (!session || !canManageTeam(session.user)) {
      return NextResponse.json({ error: "Access denied. Only Admins or users tagged 'admin' can manage the team." }, { status: 403 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete profile records
    if (user.role === "Channel Partner") {
      await ChannelPartner.findOneAndUpdate({ userId: user._id }, { $set: { isDeleted: true } });
    } else {
      await TeamProfile.findOneAndUpdate({ userId: user._id }, { $set: { isDeleted: true } });
    }

    // Delete credentials
    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting team user:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
