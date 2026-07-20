import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { verifyPermission, getChannelPartnerScope } from "@/lib/middlewares/auth.middleware";
import ChannelPartner from "@/lib/models/ChannelPartner";

/**
 * Returns the ChannelPartner record linked to the logged-in "Channel Partner"
 * user, so the partner portal can discover its own scope.
 */
export async function GET() {
  try {
    await dbConnect();
    const authResult = await verifyPermission(["Channel Partner"]);
    if (authResult instanceof NextResponse) return authResult;

    const scope = await getChannelPartnerScope(authResult.user);
    if (scope instanceof NextResponse) return scope;
    if (!scope) {
      // Staff accounts have no partner scope
      return NextResponse.json({ error: "Not a channel partner account" }, { status: 403 });
    }

    const partner = await ChannelPartner.findOne({ _id: scope, isDeleted: false });
    if (!partner) {
      return NextResponse.json({ error: "Channel partner profile not found" }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error: any) {
    console.error("Error loading own channel partner profile:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
