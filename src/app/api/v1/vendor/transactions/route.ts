import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia"
});

// Mark route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const user = await requireRole(request, "vendor");
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('vendorId');
        const period = searchParams.get('period') || 'month'; // week, month, quarter, year

        if (!vendorId) {
            return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        // Verify the user is requesting their own data
        if (user.uid !== vendorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();
        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1); // Default to last month
        }

        // Query orders
        const ordersQuery = query(
            collection(db, "orders"),
            where("vendorId", "==", vendorId),
            where("purchaseDate", ">=", startDate),
            orderBy("purchaseDate", "desc")
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'order',
            date: doc.data().purchaseDate?.toDate?.() || doc.data().purchaseDate,
        }));

        // Calculate summary statistics
        const summary = orders.reduce((acc: any, order: any) => {
            acc.totalEarnings += order.amount || 0;
            
            if (order.payoutStatus === 'withdrawn') {
                acc.withdrawn += order.amount || 0;
            } else if (order.payoutStatus === 'available') {
                acc.available += order.amount || 0;
            } else if (order.payoutStatus === 'pending') {
                acc.pending += order.amount || 0;
            }

            return acc;
        }, {
            totalEarnings: 0,
            withdrawn: 0,
            available: 0,
            pending: 0
        });

        // Format transactions for the UI
        const transactions = orders.map((order: any) => ({
            id: order.id,
            date: order.date,
            type: 'order',
            amount: order.amount,
            status: order.payoutStatus,
            customerEmail: order.customerEmail,
            method: 'Stripe',
            metadata: {
                products: order.products,
                shippingStatus: order.shippingStatus,
                transferId: order.stripeTransferId
            }
        }));

        return NextResponse.json({
            transactions,
            summary
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching vendor transactions:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 