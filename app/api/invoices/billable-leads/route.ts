import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, STAFF_ROLES } from "@/lib/middlewares/auth.middleware";
import { InvoiceService, InvoiceError } from "@/lib/services/invoice.service";

const invoiceService = new InvoiceService();

export async function GET(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(STAFF_ROLES);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if ((entityType !== "Bank" && entityType !== "ChannelPartner") || !entityId) {
      return NextResponse.json(
        { error: "entityType (Bank | ChannelPartner) and entityId are required" },
        { status: 400 }
      );
    }

    const result = await invoiceService.getBillableLeads({
      entityType,
      entityId,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error loading billable leads:", error);
    return NextResponse.json({ error: "Failed to load billable applications" }, { status: 500 });
  }
}
