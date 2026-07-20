import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, getChannelPartnerScope } from "@/lib/middlewares/auth.middleware";
import Lead from "@/lib/models/Lead";
import LeadDocument from "@/lib/models/LeadDocument";
import LeadActivity from "@/lib/models/LeadActivity";

const DOCUMENT_FOLDERS = ["KYC", "Bank Documents", "Financial Documents", "Property Documents", "Other"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const scope = await getChannelPartnerScope(authResult.user);
    if (scope instanceof NextResponse) return scope;
    if (scope) {
      const lead = await Lead.findOne({ _id: id, channelPartnerId: scope, isDeleted: false }).select("_id");
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const documents = await LeadDocument.find({ leadId: id }).sort({ createdAt: -1 });
    return NextResponse.json(documents);
  } catch (error: any) {
    console.error("Error listing lead documents:", error);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager", "Employee", "Team"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const lead = await Lead.findOne({ _id: id, isDeleted: false });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = String(formData.get("folder") || "");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File is too large (max 10 MB)" }, { status: 400 });
    }
    if (!DOCUMENT_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { error: `Invalid folder. Must be one of: ${DOCUMENT_FOLDERS.join(", ")}` },
        { status: 400 }
      );
    }

    // Unique, path-safe filename on disk; the original name is kept in the DB
    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, storedName), Buffer.from(await file.arrayBuffer()));

    const document = await LeadDocument.create({
      leadId: lead._id,
      name: file.name,
      folder,
      url: `/uploads/${storedName}`,
      uploadedBy: user.name,
    });

    await LeadActivity.create({
      leadId: lead._id,
      action: "Document Uploaded",
      new_value: folder,
      remarks: file.name,
      user: user.name,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("Error uploading lead document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
