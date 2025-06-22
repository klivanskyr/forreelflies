import { NextRequest, NextResponse } from "next/server";
import { tokenToUser } from "@/lib/firebase-admin";

export async function requireRole(request: NextRequest, role: "admin" | "vendor" | "user") {
  const user: any = await tokenToUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role === "admin" && !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "vendor" && !user.isVendor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // For 'user', just check authentication
  return user;
} 