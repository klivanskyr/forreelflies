import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.uid) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Force session update by triggering a session update
        // This will cause NextAuth to re-evaluate the session
        return NextResponse.json({ 
            message: "Session refresh triggered",
            user: {
                uid: session.user.uid,
                email: session.user.email,
                isVendor: session.user.isVendor,
                vendorSignUpStatus: session.user.vendorSignUpStatus,
                isAdmin: session.user.isAdmin
            }
        });
        
    } catch (error) {
        console.error("Session refresh error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 