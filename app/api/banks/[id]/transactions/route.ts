import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission } from "@/lib/middlewares/auth.middleware";
import { CommissionService } from "@/lib/services/commission.service";
import Commission from "@/lib/models/Commission";
import CommissionPayment from "@/lib/models/CommissionPayment";
import { z } from "zod";

const commissionService = new CommissionService();

const PaymentRecordSchema = z.object({
  commissionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Commission ID"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Payment Date must be YYYY-MM-DD"),
  paymentMode: z.enum(["NEFT", "RTGS", "IMPS", "UPI", "Cheque", "Cash"]),
  referenceNumber: z.string().min(3, "Reference Number (UTR) is required"),
  invoiceNumber: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal("")),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission();
    if (authResult instanceof NextResponse) return authResult;

    // 1. Find all Commission records for this Bank
    const commissions = await Commission.find({ entityId: id, entityType: "Bank", isDeleted: false });
    const commissionIds = commissions.map((c) => c._id);

    // 2. Find all payments made against these commissions
    const payments = await CommissionPayment.find({
      commissionId: { $in: commissionIds },
      isDeleted: false,
    })
      .populate({
        path: "caseId",
        select: "applicationNumber applicantName loanAmount status",
      })
      .sort({ paymentDate: -1 });

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error(`Error loading transactions for bank ${id}:`, error);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Super Admin", "Admin", "Manager"]);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const validationResult = PaymentRecordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify this commission belongs to the Bank
    const commission = await Commission.findOne({ _id: data.commissionId, entityId: id, entityType: "Bank" });
    if (!commission) {
      return NextResponse.json({ error: "Commission record not found or does not belong to this bank" }, { status: 404 });
    }

    await commissionService.recordPayment({
      commissionId: data.commissionId,
      amount: data.amount,
      paymentDate: data.paymentDate,
      paymentMode: data.paymentMode,
      referenceNumber: data.referenceNumber,
      invoiceNumber: data.invoiceNumber,
      remarks: data.remarks,
      performedBy: user.name,
    });

    return NextResponse.json({ success: true, message: "Payment recorded successfully" });
  } catch (error: any) {
    console.error(`Error recording transaction for bank ${id}:`, error);
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 500 });
  }
}
