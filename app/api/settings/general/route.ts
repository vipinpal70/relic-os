import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import SystemSettings from "@/lib/models/SystemSettings";

export async function GET() {
  try {
    await dbConnect();
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        systemName: "Relic OS",
        organizationName: "Elevana Consultancy",
        timezone: "Asia/Kolkata (IST)",
        dateFormat: "DD/MM/YYYY",
        currency: "INR (₹)",
      });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Error fetching general settings:", error);
    return NextResponse.json({ error: "Failed to fetch general settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager"]);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { systemName, organizationName, timezone, dateFormat, currency } = body;

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({
        systemName: systemName || "Relic OS",
        organizationName: organizationName || "Elevana Consultancy",
        timezone: timezone || "Asia/Kolkata (IST)",
        dateFormat: dateFormat || "DD/MM/YYYY",
        currency: currency || "INR (₹)",
      });
    } else {
      if (systemName !== undefined) settings.systemName = systemName;
      if (organizationName !== undefined) settings.organizationName = organizationName;
      if (timezone !== undefined) settings.timezone = timezone;
      if (dateFormat !== undefined) settings.dateFormat = dateFormat;
      if (currency !== undefined) settings.currency = currency;
    }

    await settings.save();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Error updating general settings:", error);
    return NextResponse.json({ error: error.message || "Failed to update general settings" }, { status: 500 });
  }
}
