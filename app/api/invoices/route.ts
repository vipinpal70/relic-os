import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, STAFF_ROLES } from "@/lib/middlewares/auth.middleware";
import { GenerateInvoiceSchema } from "@/lib/validations/invoice.validation";
import { InvoiceService, InvoiceError } from "@/lib/services/invoice.service";
import { InvoiceRepository } from "@/lib/repositories/invoice.repository";

const invoiceService = new InvoiceService();
const invoiceRepo = new InvoiceRepository();

export async function GET(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(STAFF_ROLES);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const result = await invoiceRepo.findAll({
      entityType: searchParams.get("entityType") || undefined,
      entityId: searchParams.get("entityId") || undefined,
      status: searchParams.get("status") || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "10", 10),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error listing invoices:", error);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const validationResult = GenerateInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const invoice = await invoiceService.generateInvoice(validationResult.data, user.name);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error generating invoice:", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
