import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import CommissionRate from "@/lib/models/CommissionRate";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const rate = await CommissionRate.findById(id);
    if (!rate) {
      return NextResponse.json({ error: "Commission rate not found" }, { status: 404 });
    }

    const fields = ["partner", "loan_type", "rate", "effective_from", "status"];
    fields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === "rate") {
          rate.rate = parseFloat(body.rate);
        } else {
          rate[field] = body[field];
        }
      }
    });

    await rate.save();
    return NextResponse.json(rate);
  } catch (error: any) {
    console.error("Error updating commission rate:", error);
    return NextResponse.json({ error: "Failed to update commission rate" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const rate = await CommissionRate.findByIdAndDelete(id);
    if (!rate) {
      return NextResponse.json({ error: "Commission rate not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Commission rate deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting commission rate:", error);
    return NextResponse.json({ error: "Failed to delete commission rate" }, { status: 500 });
  }
}
