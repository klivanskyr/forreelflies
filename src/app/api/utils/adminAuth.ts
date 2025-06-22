import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.NEXTAUTH_SECRET + "_admin"; // Same key as login

// Secure admin authentication function using JWT
export async function requireAdmin(request: NextRequest): Promise<NextResponse | true> {
    const adminToken = request.cookies.get("admin_token");
    
    if (!adminToken) {
        console.log("SERVER ERROR: Admin token missing");
        return NextResponse.json({ error: "Admin authentication required" }, { status: 403 });
    }
    
    try {
        // Verify and decode the JWT token
        const decoded = jwt.verify(adminToken.value, ADMIN_JWT_SECRET) as any;
        
        // Check if the credentials in the token are correct
        if (decoded.username !== "admin" || decoded.password !== "Cockelmann") {
            console.log("SERVER ERROR: Invalid admin credentials in token");
            return NextResponse.json({ error: "Invalid credentials" }, { status: 403 });
        }
        
        return true;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.log("SERVER ERROR: Admin token expired");
            return NextResponse.json({ error: "Token expired" }, { status: 403 });
        } else if (error instanceof jwt.JsonWebTokenError) {
            console.log("SERVER ERROR: Invalid admin token");
            return NextResponse.json({ error: "Invalid token" }, { status: 403 });
        } else {
            console.log("SERVER ERROR: Error validating admin token:", error);
            return NextResponse.json({ error: "Authentication error" }, { status: 500 });
        }
    }
} 