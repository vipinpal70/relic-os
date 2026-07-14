import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import LoanType from "@/lib/models/LoanType";
import ActivityLog from "@/lib/models/ActivityLog";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: any = { isDeleted: false };
    if (status) query.status = status;

    const loanTypes = await LoanType.find(query).sort({ name: 1 });
    return NextResponse.json(loanTypes);
  } catch (error: any) {
    console.error("Error fetching loan types:", error);
    return NextResponse.json({ error: "Failed to fetch loan types" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    // Allow Admins, Super Admins, and Managers to add loan types
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Loan type name is required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const exists = await LoanType.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, "i") },
      isDeleted: false,
    });

    if (exists) {
      return NextResponse.json({ error: "Loan type already exists" }, { status: 409 });
    }

    const newType = await LoanType.create({
      name: cleanName,
      status: "Active",
      createdBy: user.name,
      updatedBy: user.name,
    });

    await ActivityLog.create({
      entityType: "LoanType",
      entityId: newType._id,
      action: "Created",
      details: `Loan type "${cleanName}" created.`,
      performedBy: user.name,
    });

    return NextResponse.json(newType, { status: 201 });
  } catch (error: any) {
    console.error("Error creating loan type:", error);
    return NextResponse.json({ error: "Failed to create loan type" }, { status: 500 });
  }
}
