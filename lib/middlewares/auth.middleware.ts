import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Manager" | "Employee" | "Team" | "Channel Partner";
  status: "Active" | "Inactive";
}

/**
 * Validates session and checks if the logged-in user possesses one of the allowed roles.
 * Returns the user object if successful, or a NextResponse error if unauthorized.
 */
export async function verifyPermission(
  allowedRoles?: string[]
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const auth = await getSessionUser();

  if (!auth || !auth.user) {
    return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
  }

  const user = auth.user as AuthenticatedUser;

  if (user.status !== "Active") {
    return NextResponse.json({ error: "Account is deactivated." }, { status: 403 });
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Standardize matching - allow Admin to match Super Admin, etc., or do direct match.
    // We also support 'Team' from the default schema as equivalent to 'Employee/Manager'
    const userRole = user.role;
    const hasRole = allowedRoles.some(
      (role) =>
        role.toLowerCase() === userRole.toLowerCase() ||
        (role.toLowerCase() === "employee" && userRole.toLowerCase() === "team") ||
        (role.toLowerCase() === "manager" && userRole.toLowerCase() === "admin")
    );

    if (!hasRole && userRole !== "Super Admin" && userRole !== "Admin") {
      return NextResponse.json(
        { error: `Forbidden. Requires role: ${allowedRoles.join(" or ")}` },
        { status: 403 }
      );
    }
  }

  return { user };
}
