import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

export async function POST(request: NextRequest) {
    try {
        // This endpoint should be called periodically (e.g., via cron job)
        // to clean up expired checkout sessions
        
        const now = new Date();
        
        // Query for expired checkout sessions
        const expiredSessionsQuery = query(
            collection(db, "checkoutSessions"),
            where("expiresAt", "<", now)
        );
        
        const expiredSessions = await getDocs(expiredSessionsQuery);
        
        // Delete expired sessions
        const deletePromises = expiredSessions.docs.map(sessionDoc => 
            deleteDoc(doc(db, "checkoutSessions", sessionDoc.id))
        );
        
        await Promise.all(deletePromises);
        
        return NextResponse.json({ 
            message: `Cleaned up ${expiredSessions.size} expired checkout sessions` 
        }, { status: 200 });
        
    } catch (error) {
        console.error("Error cleaning up checkout sessions:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 