import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import CommissionRate from "@/lib/models/CommissionRate";

export async function GET() {
  try {
    await dbConnect();
    const rates = await CommissionRate.find().sort({ createdAt: -1 });
    return NextResponse.json(rates);
  } catch (error: any) {
    console.error("Error loading commission rates:", error);
    return NextResponse.json({ error: "Failed to connect to database" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { type, partner, loan_type, rate, effective_from, status } = body;

    if (!type || !partner || !loan_type || rate === undefined || !effective_from) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const newRate = await CommissionRate.create({
      type,
      partner,
      loan_type,
      rate: parseFloat(rate),
      effective_from,
      status: status || "Active",
    });

    return NextResponse.json(newRate);
  } catch (error: any) {
    console.error("Error creating commission rate:", error);
    return NextResponse.json({ error: "Failed to create commission rate" }, { status: 500 });
  }
}
