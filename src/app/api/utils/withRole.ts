import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";

type Role = "admin" | "vendor" | "user";

export async function requireRole(request: NextRequest, role: Role | Role[]) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const roles = Array.isArray(role) ? role : [role];

    // Check if user has any of the required roles
    const hasRequiredRole = roles.some(r => {
      if (r === "admin") return user.isAdmin;
      if (r === "vendor") return user.isVendor;
      if (r === "user") return true; // All authenticated users have 'user' role
      return false;
    });

    if (!hasRequiredRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return user;
  } catch (error) {
    console.error("Error in requireRole:", error);
    return NextResponse.json({ error: "Authentication error" }, { status: 401 });
  }
} 