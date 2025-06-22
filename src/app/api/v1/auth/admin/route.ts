import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  const adminDoc = await getDoc(doc(db, "admins", username));
  if (!adminDoc.exists()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const adminData = adminDoc.data();
  if (adminData.password !== password) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Set a simple cookie for admin session
  const res = NextResponse.json({ success: true }, { status: 200 });
  res.cookies.set("admin_token", "admin_session", { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 });
  return res;
} 