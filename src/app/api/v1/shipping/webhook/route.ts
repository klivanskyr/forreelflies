import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import shippo from "@/lib/shippo";
import crypto from "crypto";
import { Order } from "@/app/types/types";

// Shippo webhook secret should be set in environment variables
const SHIPPO_WEBHOOK_SECRET = process.env.SHIPPO_WEBHOOK_SECRET;

// Verify Shippo webhook signature
function verifyShippoSignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const rawBody = await request.text();
        
        // Verify webhook signature if provided
        const signature = request.headers.get('Shippo-Signature');
        if (SHIPPO_WEBHOOK_SECRET && signature) {
            try {
                if (!verifyShippoSignature(rawBody, signature, SHIPPO_WEBHOOK_SECRET)) {
                    console.error("❌ Invalid Shippo webhook signature");
                    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
                }
                console.log("✅ Shippo webhook signature verified");
            } catch (error) {
                console.error("❌ Error verifying Shippo webhook signature:", error);
                return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
            }
        } else {
            console.warn("⚠️ No Shippo webhook signature verification - SHIPPO_WEBHOOK_SECRET not configured");
        }

        // Parse the body
        const data = JSON.parse(rawBody);
        console.log("📦 Received Shippo webhook:", data.event);

        // Handle different tracking events
        if (data.event !== "track_updated") {
            return NextResponse.json({ message: "Event type not handled" }, { status: 200 });
        }

        const tracking = data.data;
        if (!tracking || !tracking.tracking_number) {
            return NextResponse.json({ error: "Invalid tracking data" }, { status: 400 });
        }

        // Find order by tracking number
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("trackingNumber", "==", tracking.tracking_number));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log("⚠️ No order found with tracking number:", tracking.tracking_number);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const orderDoc = querySnapshot.docs[0];
        const order = { id: orderDoc.id, ...orderDoc.data() } as Order;

        if (!order || !order.id) {
            console.log("⚠️ Invalid order data:", order);
            return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
        }

        // Map Shippo status to our status
        let shippingStatus = order.shippingStatus;
        let payoutStatus = order.payoutStatus;
        const now = new Date();
        const updateData: Partial<Order> = {
            lastTrackingUpdate: now
        };

        switch (tracking.status.toLowerCase()) {
            case "pre_transit":
                shippingStatus = "label_created";
                break;
            case "transit":
            case "in_transit":
                shippingStatus = "shipped";
                break;
            case "delivered":
                shippingStatus = "delivered";
                const deliveryDate = new Date(tracking.status_date);
                updateData.deliveredDate = deliveryDate;
                
                // Calculate withdrawal availability date (30 days after delivery)
                const withdrawalDate = new Date(deliveryDate);
                withdrawalDate.setDate(withdrawalDate.getDate() + 30);
                updateData.withdrawAvailableDate = withdrawalDate;
                
                // If 30 days have passed since delivery, make funds available
                const daysSinceDelivery = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceDelivery >= 30 && payoutStatus === 'pending') {
                    payoutStatus = 'available';
                }
                break;
            case "failure":
            case "error":
                shippingStatus = "delivery_failed";
                break;
            case "unknown":
                shippingStatus = "tracking_lost";
                break;
            default:
                // Keep existing status
                break;
        }

        // Update order status
        updateData.shippingStatus = shippingStatus;
        if (payoutStatus !== order.payoutStatus) {
            updateData.payoutStatus = payoutStatus;
        }

        if (tracking.eta) {
            updateData.estimatedDeliveryDate = new Date(tracking.eta);
        }

        try {
            await updateDoc(doc(db, "orders", order.id), updateData);

            console.log("✅ Updated order shipping status:", {
                orderId: order.id,
                oldStatus: order.shippingStatus,
                newStatus: shippingStatus,
                oldPayoutStatus: order.payoutStatus,
                newPayoutStatus: payoutStatus,
                withdrawalDate: updateData.withdrawAvailableDate,
                deliveryDate: updateData.deliveredDate,
                lastUpdate: updateData.lastTrackingUpdate
            });

            // Return detailed success response
            return NextResponse.json({ 
                success: true,
                orderId: order.id,
                status: shippingStatus,
                payoutStatus,
                tracking: {
                    number: tracking.tracking_number,
                    status: tracking.status,
                    lastUpdate: updateData.lastTrackingUpdate,
                    estimatedDelivery: updateData.estimatedDeliveryDate,
                    deliveryDate: updateData.deliveredDate
                }
            });

        } catch (error) {
            console.error("❌ Error updating order:", {
                orderId: order.id,
                error: error instanceof Error ? error.message : "Unknown error",
                updateData
            });
            return NextResponse.json(
                { error: "Failed to update order status" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("❌ Error processing Shippo webhook:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 