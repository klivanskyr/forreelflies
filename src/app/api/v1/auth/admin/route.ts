import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.NEXTAUTH_SECRET + "_admin"; // Different key for admin tokens

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  
  console.log("Admin login attempt:", { username, password: password ? "***" : "empty" });
  
  // Check admin credentials
  if (username !== "admin" || password !== "Cockelmann") {
    console.log("Admin login failed: Invalid credentials");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  console.log("Admin login successful");
  
  // Create JWT token with 1 day expiration
  const token = jwt.sign(
    { 
      username: username,
      password: password,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 1 day
    },
    ADMIN_JWT_SECRET
  );
  
  // Set the JWT token as an HTTP-only cookie
  const res = NextResponse.json({ success: true }, { status: 200 });
  res.cookies.set("admin_token", token, { 
    httpOnly: true, 
    path: "/", 
    maxAge: 24 * 60 * 60, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res;
} 