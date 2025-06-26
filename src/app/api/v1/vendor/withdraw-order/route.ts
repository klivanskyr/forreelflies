import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Stripe from "stripe";
import { Order } from "@/app/types/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest) {
    const user = await requireRole(request, "vendor");
    if (user instanceof NextResponse) return user;

    try {
        const { vendorId, orderId } = await request.json();

        if (!vendorId || !orderId) {
            return NextResponse.json({ error: "Vendor ID and Order ID are required" }, { status: 400 });
        }

        // Verify the user is requesting their own order
        if (user.uid !== vendorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Get order details
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (!orderDoc.exists()) {
            console.error("❌ Order not found:", orderId);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        const order = { id: orderDoc.id, ...orderDoc.data() } as Order;

        // Verify vendor owns this order
        if (order.vendorId !== vendorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Check if order is available for withdrawal
        if (order.payoutStatus !== 'available') {
            return NextResponse.json({ error: "Order is not available for withdrawal" }, { status: 400 });
        }

        // Check if withdrawal date has passed
        const withdrawDate = order.withdrawAvailableDate instanceof Date 
            ? order.withdrawAvailableDate 
            : new Date(order.withdrawAvailableDate.seconds * 1000);
        const now = new Date();
        if (withdrawDate > now) {
            return NextResponse.json({ 
                error: `Order is not available for withdrawal until ${withdrawDate.toLocaleDateString()}` 
            }, { status: 400 });
        }

        // Get vendor's Stripe account ID
        const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
        if (!vendorDoc.exists()) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        const vendorData = vendorDoc.data();
        const stripeAccountId = vendorData.stripeAccountId;

        if (!stripeAccountId) {
            return NextResponse.json({ error: "Vendor Stripe account not found" }, { status: 400 });
        }

        // Calculate withdrawal amount (deduct platform fee)
        const orderAmount = Math.round(order.amount * 100); // Convert to cents
        const platformFee = Math.round(orderAmount * 0.1); // 10% platform fee
        const withdrawalAmount = orderAmount - platformFee;

        if (!order.id) {
            throw new Error("Order ID is required");
        }

        try {
            // Create transfer to vendor's connected account
            const transfer = await stripe.transfers.create({
                amount: withdrawalAmount,
                currency: order.currency || "usd",
                destination: stripeAccountId,
                metadata: {
                    orderId: order.id,
                    vendorId: vendorId,
                    type: 'individual_order_withdrawal'
                }
            });

            // Update order status
            await updateDoc(doc(db, "orders", order.id), {
                payoutStatus: 'withdrawn',
                stripeTransferId: transfer.id,
                withdrawnAt: new Date()
            });

            return NextResponse.json({ 
                success: true, 
                transferId: transfer.id,
                amount: withdrawalAmount / 100 // Convert back to dollars
            }, { status: 200 });

        } catch (stripeError) {
            console.error("Stripe transfer failed:", stripeError);
            return NextResponse.json({ 
                error: "Payment transfer failed", 
                details: stripeError instanceof Error ? stripeError.message : "Unknown error"
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Error withdrawing order:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 