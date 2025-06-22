import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireRole(request: NextRequest, role: "admin" | "vendor" | "user") {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  if (role === "admin" && !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "vendor" && !user.isVendor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // For 'user', just check authentication
  return user;
} 