import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

type Role = "admin" | "vendor" | "user";

export async function requireRole(request: NextRequest, role: Role | Role[]) {
  try {
    // First, check for admin token
    const adminToken = request.cookies.get("admin_token");
    if (adminToken) {
      try {
        const ADMIN_JWT_SECRET = process.env.NEXTAUTH_SECRET + "_admin";
        const decoded = jwt.verify(adminToken.value, ADMIN_JWT_SECRET) as any;
        
        // Check if the credentials in the token are correct
        if (decoded.username === "admin" && decoded.password === "Cockelmann") {
          console.log("🔍 requireRole - Admin token validated");
          // Return a mock user object for admin
          return {
            uid: "admin",
            email: "admin@example.com",
            isAdmin: true,
            isVendor: false
          };
        }
      } catch (error) {
        console.log("🔍 requireRole - Admin token validation failed:", error);
      }
    }

    // If no admin token or invalid, check for NextAuth session
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

    console.log("🔍 requireRole - User:", user.uid, "isVendor:", user.isVendor, "isAdmin:", user.isAdmin);
    console.log("🔍 requireRole - Required roles:", roles, "Has required role:", hasRequiredRole);

    if (!hasRequiredRole) {
      console.log("❌ requireRole - Access denied for user:", user.uid);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return user;
  } catch (error) {
    console.error("Error in requireRole:", error);
    return NextResponse.json({ error: "Authentication error" }, { status: 401 });
  }
} 