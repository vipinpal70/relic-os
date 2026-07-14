import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import TeamProfile from "@/lib/models/TeamProfile";
import ChannelPartner from "@/lib/models/ChannelPartner";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch all users
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        
        if (user.role === "Channel Partner") {
          // Find channel partner profile linked to this user
          const partnerProfile = await ChannelPartner.findOne({ userId: user._id, isDeleted: false });
          return {
            ...userObj,
            profile: partnerProfile || null,
          };
        } else {
          // Find internal team profile
          const teamProfile = await TeamProfile.findOne({ userId: user._id, isDeleted: false });
          return {
            ...userObj,
            profile: teamProfile || null,
          };
        }
      })
    );

    return NextResponse.json(enrichedUsers);
  } catch (error: any) {
    console.error("Error fetching team users:", error);
    return NextResponse.json({ error: error.message || "Failed to load team users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Auth Check: Only Admins can manage team
    const session = await getSessionUser();
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Access denied. Only Admins can manage the team." }, { status: 403 });
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

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Name, email, password, and role are required." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone,
      status: status || "Active",
      tag,
      assigned_partner,
    });

    // Create Profile depending on role
    if (role === "Channel Partner") {
      const cpEmail = email.toLowerCase();
      
      // If a channel partner already exists with this email or name, link to it; otherwise create new
      let cp = await ChannelPartner.findOne({ 
        $or: [
          { email: cpEmail },
          { name: name },
          { companyName: companyName || name }
        ],
        isDeleted: false 
      });

      if (cp) {
        cp.userId = newUser._id;
        if (phone && !cp.phone) cp.phone = phone;
        if (companyName) cp.companyName = companyName;
        await cp.save();
      } else {
        cp = await ChannelPartner.create({
          userId: newUser._id,
          name,
          companyName: companyName || name,
          email: cpEmail,
          phone: phone || "0000000000",
          alternativePhone,
          address,
          state,
          city,
          gst,
          pan,
          status: status || "Active",
          notes,
          commissionTable: [],
          createdBy: session.user.name,
          updatedBy: session.user.name,
        });
      }
    } else {
      // Create internal team profile
      await TeamProfile.create({
        userId: newUser._id,
        employeeId: employeeId || `EMP-${Date.now().toString().slice(-4)}`,
        department: department || "Sales",
        designation: designation || (role === "Admin" ? "Admin" : "Relationship Manager"),
        reportingManagerId: reportingManagerId || null,
        pan,
        aadhaar,
        bankAccountNumber,
        bankIfsc,
      });
    }

    return NextResponse.json({ message: "User and profile created successfully", userId: newUser._id }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating team user:", error);
    return NextResponse.json({ error: error.message || "Failed to create team user" }, { status: 500 });
  }
}
