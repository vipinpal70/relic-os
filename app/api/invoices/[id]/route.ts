import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, STAFF_ROLES } from "@/lib/middlewares/auth.middleware";
import { UpdateInvoiceStatusSchema } from "@/lib/validations/invoice.validation";
import { InvoiceService, InvoiceError } from "@/lib/services/invoice.service";
import { InvoiceRepository } from "@/lib/repositories/invoice.repository";

const invoiceService = new InvoiceService();
const invoiceRepo = new InvoiceRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(STAFF_ROLES);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const invoice = await invoiceRepo.findById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const body = await request.json();
    const validationResult = UpdateInvoiceStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const invoice = await invoiceService.updateStatus(id, validationResult.data, user.name);
    return NextResponse.json(invoice);
  } catch (error: any) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id } = await params;
    const invoice = await invoiceService.cancelInvoice(id, user.name);
    return NextResponse.json(invoice);
  } catch (error: any) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error cancelling invoice:", error);
    return NextResponse.json({ error: "Failed to cancel invoice" }, { status: 500 });
  }
}
