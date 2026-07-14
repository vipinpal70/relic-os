import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Integration from "@/lib/models/Integration";

export async function GET() {
  try {
    await dbConnect();
    
    // Find the single system-level integration entry
    let config = await Integration.findOne();
    if (!config) {
      config = await Integration.create({
        googleSheetUrl: "",
        syncInterval: "every_2_hours",
        isActive: false,
        lastSyncStatus: "never",
        recordsImportedInLastRun: 0,
      });
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Database connection failed. Falling back to default mock integration settings:", error);
    return NextResponse.json({
      googleSheetUrl: "https://docs.google.com/spreadsheets/d/1lHM-iuYPX-YdWqldMO6r0OzpjafXg8cQgOIxEMawjeI/edit?pli=1&gid=351352879#gid=351352879",
      syncInterval: "every_2_hours",
      isActive: false,
      lastSyncStatus: "never",
      recordsImportedInLastRun: 0,
      isFallback: true
    });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { googleSheetUrl, syncInterval, isActive } = body;

    let config = await Integration.findOne();
    if (!config) {
      config = new Integration();
    }

    config.googleSheetUrl = googleSheetUrl;
    config.syncInterval = syncInterval;
    config.isActive = isActive;

    await config.save();

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Database connection failed. Mocking update response for integration settings:", error);
    try {
      const body = await request.json();
      return NextResponse.json({
        ...body,
        lastSyncStatus: "never",
        recordsImportedInLastRun: 0,
        isFallback: true
      });
    } catch {
      return NextResponse.json({
        googleSheetUrl: "",
        syncInterval: "every_2_hours",
        isActive: false,
        lastSyncStatus: "never",
        recordsImportedInLastRun: 0,
        isFallback: true
      });
    }
  }
}
