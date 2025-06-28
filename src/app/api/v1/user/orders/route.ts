import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Verify the user is requesting their own orders
        if (user.uid !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Query orders where customerId matches the user ID
        // Note: Removed orderBy to avoid Firebase composite index requirement
        const ordersQuery = query(
            collection(db, "orders"),
            where("customerId", "==", userId)
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).sort((a: any, b: any) => {
            // Sort by purchaseDate in descending order (newest first)
            const dateA = a.purchaseDate?.toDate?.() || new Date(a.purchaseDate);
            const dateB = b.purchaseDate?.toDate?.() || new Date(b.purchaseDate);
            return dateB.getTime() - dateA.getTime();
        });

        return NextResponse.json({ orders }, { status: 200 });

    } catch (error) {
        console.error("Error fetching user orders:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 