import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(request: NextRequest) {
    const user = await requireRole(request, "vendor");
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('vendorId');

        if (!vendorId) {
            return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        // Verify the user is requesting their own orders
        if (user.uid !== vendorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Query orders where vendorId matches
        const ordersQuery = query(
            collection(db, "orders"),
            where("vendorId", "==", vendorId)
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore timestamp to serializable format
            purchaseDate: doc.data().purchaseDate?.toDate?.() ? {
                seconds: doc.data().purchaseDate.seconds,
                nanoseconds: doc.data().purchaseDate.nanoseconds
            } : doc.data().purchaseDate,
            withdrawAvailableDate: doc.data().withdrawAvailableDate?.toDate?.() ? {
                seconds: doc.data().withdrawAvailableDate.seconds,
                nanoseconds: doc.data().withdrawAvailableDate.nanoseconds
            } : doc.data().withdrawAvailableDate
        })).sort((a: any, b: any) => {
            // Sort by purchaseDate descending (newest first)
            const dateA = a.purchaseDate?.seconds || 0;
            const dateB = b.purchaseDate?.seconds || 0;
            return dateB - dateA;
        });

        return NextResponse.json({ orders }, { status: 200 });

    } catch (error) {
        console.error("Error fetching vendor orders:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 