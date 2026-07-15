import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Case from "@/lib/models/Case";
import DocumentModel from "@/lib/models/Document";
import ActivityLog from "@/lib/models/ActivityLog";
import { getSessionUser } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

function buildClientId(email: string, phone: string): string {
  const cleanEmail = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `${cleanEmail}_${cleanPhone}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    let c = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      c = await Case.findOne({ _id: id, isDeleted: false });
    }
    if (!c) {
      c = await Case.findOne({ applicationNumber: id, isDeleted: false });
    }

    if (!c) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const docs = await DocumentModel.find({ entityType: "Case", entityId: c._id, isDeleted: false }).sort({ createdAt: -1 });
    const formatted = docs.map((d) => ({
      _id: d._id.toString(),
      leadId: c._id.toString(),
      name: d.name,
      folder: d.fileType,
      url: d.fileUrl,
      uploadedBy: d.uploadedBy,
      createdAt: d.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error loading lead documents:", error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;

    if (!file || !folder) {
      return NextResponse.json({ error: "File and folder are required" }, { status: 400 });
    }

    let c = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      c = await Case.findOne({ _id: id, isDeleted: false });
    }
    if (!c) {
      c = await Case.findOne({ applicationNumber: id, isDeleted: false });
    }

    if (!c) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const clientId = buildClientId(c.email, c.phone);
    const safeFolderName = folder.replace(/[^a-zA-Z0-9 _-]/g, "_");
    const uploadDir = path.join(process.cwd(), "public", "uploads", clientId, safeFolderName);
    await fs.mkdir(uploadDir, { recursive: true });

    const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${clientId}/${safeFolderName}/${uniqueFilename}`;

    const session = await getSessionUser();
    const userName = session?.user?.name || "System";

    const document = await DocumentModel.create({
      entityType: "Case",
      entityId: c._id,
      name: file.name,
      fileUrl: publicUrl,
      fileType: folder,
      fileSize: file.size,
      uploadedBy: userName,
    });

    await ActivityLog.create({
      entityType: "Case",
      entityId: c._id,
      action: "Document Uploaded",
      details: `Uploaded file: "${file.name}" to category: "${folder}".`,
      performedBy: userName,
    });

    const formatted = {
      _id: document._id.toString(),
      leadId: c._id.toString(),
      name: document.name,
      folder: document.fileType,
      url: document.fileUrl,
      uploadedBy: document.uploadedBy,
      createdAt: document.createdAt,
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Failed to upload document to local storage" }, { status: 500 });
  }
}
