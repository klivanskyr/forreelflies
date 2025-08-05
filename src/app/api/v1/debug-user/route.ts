import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.uid) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const userId = session.user.uid;
        
        // Get user document
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        // Get vendor document
        const vendorDoc = await getDoc(doc(db, "vendors", userId));
        const vendorData = vendorDoc.exists() ? vendorDoc.data() : null;
        
        // Calculate vendor status
        const vendorSignUpStatus = userData?.vendorSignUpStatus || "notStarted";
        const isVendor = vendorSignUpStatus === 'vendorActive' || 
                        vendorSignUpStatus === 'onboardingStarted' || 
                        vendorSignUpStatus === 'onboardingCompleted';
        
        return NextResponse.json({
            session: {
                uid: session.user.uid,
                email: session.user.email,
                isVendor: session.user.isVendor,
                vendorSignUpStatus: session.user.vendorSignUpStatus,
                isAdmin: session.user.isAdmin
            },
            userDocument: userData,
            vendorDocument: vendorData,
            calculated: {
                vendorSignUpStatus,
                isVendor
            }
        });
        
    } catch (error) {
        console.error("Debug user error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 