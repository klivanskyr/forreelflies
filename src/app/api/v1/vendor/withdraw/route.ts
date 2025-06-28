import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, updateDoc, where, Timestamp } from "firebase/firestore";
import Stripe from "stripe";
import { Order } from "@/app/types/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest) {
    const user = await requireRole(request, "vendor");
    if (user instanceof NextResponse) return user;

    try {
        const { vendorId } = await request.json();
        if (!vendorId || vendorId !== user.uid) {
            return NextResponse.json({ error: "vendorId required and must match authenticated user" }, { status: 400 });
        }

        // Find eligible orders
        const now = new Date();
        const ordersRef = collection(db, "orders");
        const q = query(
            ordersRef,
            where("vendorId", "==", vendorId),
            where("payoutStatus", "==", "available")
        );
        const snapshot = await getDocs(q);
        const eligibleOrders = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Order))
            .filter(order => {
                const withdrawDate = order.withdrawAvailableDate instanceof Date 
                    ? order.withdrawAvailableDate 
                    : (order.withdrawAvailableDate as Timestamp).toDate();
                return withdrawDate <= now;
            });

        if (eligibleOrders.length === 0) {
            return NextResponse.json({ error: "No eligible orders for withdrawal" }, { status: 400 });
        }

        // Calculate total amount to withdraw
        const totalAmount = eligibleOrders.reduce((sum, order) => sum + order.amount, 0);

        // Get vendor's Stripe account ID
        const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
        if (!vendorDoc.exists()) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        const vendorData = vendorDoc.data();
        if (!vendorData.stripeAccountId) {
            return NextResponse.json({ error: "Vendor has no Stripe account" }, { status: 400 });
        }

        try {
            // Create transfer to connected account
            const payout = await stripe.transfers.create({
                amount: Math.round(totalAmount * 100), // Convert to cents
                currency: 'usd',
                destination: vendorData.stripeAccountId,
                description: `Payout for ${eligibleOrders.length} orders`
            });

            // Update orders as withdrawn
            for (const order of eligibleOrders) {
                if (!order.id) {
                    console.error("Order missing ID:", order);
                    continue;
                }
                
                await updateDoc(doc(db, "orders", order.id), {
                    payoutStatus: 'withdrawn',
                    stripeTransferId: payout.id,
                    withdrawnAt: new Date()
                });
            }

            return NextResponse.json({ success: true, payout });

        } catch (error) {
            console.error("Failed to process withdrawal:", error);
            return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
        }

    } catch (error) {
        console.error("Error processing withdrawal:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 