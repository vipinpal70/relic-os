import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/mongodb";
import Session from "@/lib/models/Session";
import User from "@/lib/models/User";
import { 
  verifyRefreshToken, 
  generateAccessToken, 
  generateRefreshToken, 
  setAuthCookies, 
  TokenPayload 
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get("redirect_to") || "/dashboard";

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Find the session in MongoDB
    const session = await Session.findOne({
      _id: decoded.sessionId,
      userId: decoded.userId,
      refreshToken,
      isValid: true,
    });

    if (!session || session.expiresAt <= new Date()) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.status !== "Active") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      sessionId: session._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };
    
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken({
      userId: user._id.toString(),
      sessionId: session._id.toString(),
    });

    // Update database session
    session.refreshToken = newRefreshToken;
    await session.save();

    // Set new cookies
    await setAuthCookies(newAccessToken, newRefreshToken);

    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error("Token refresh route error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
