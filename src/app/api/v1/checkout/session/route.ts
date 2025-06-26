import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        // Retrieve the checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // Retrieve vendor details from Firestore using checkout session ID
        let vendorDetails = [];
        if (session.metadata?.checkoutSessionId) {
            try {
                const { db } = await import("@/lib/firebase");
                const { doc, getDoc } = await import("firebase/firestore");
                
                const checkoutDoc = await getDoc(doc(db, "checkoutSessions", session.metadata.checkoutSessionId));
                if (checkoutDoc.exists()) {
                    const checkoutData = checkoutDoc.data();
                    vendorDetails = checkoutData.vendorDetails || [];
                }
            } catch (error) {
                console.error("Failed to retrieve checkout session data:", error);
            }
        }

        // Transform the data for the frontend
        const orderSummary = {
            sessionId: session.id,
            totalAmount: (session.amount_total || 0) / 100, // Convert cents to dollars
            currency: session.currency || 'usd',
            customerEmail: session.customer_email || '',
            paymentStatus: session.payment_status || 'unknown',
            orders: vendorDetails.map((vendor: any) => {
                // Calculate product subtotal from cart items
                const subtotal = (vendor.cartItems || []).reduce((sum: number, item: any) => 
                    sum + (item.product?.price || 0) * (item.quantity || 1), 
                0);
                const shippingCost = (vendor.shippingFee || 0);
                const total = subtotal + shippingCost;

                return {
                    vendorId: vendor.vendorId,
                    vendorName: vendor.vendorName || 'Unknown Vendor',
                    subtotal: subtotal,
                    shippingCost: shippingCost,
                    total: total,
                    products: (vendor.cartItems || []).map((item: any) => ({
                        name: item.product?.name || 'Unknown Product',
                        quantity: item.quantity || 1,
                        price: item.product?.price || 0,
                    }))
                };
            })
        };

        return NextResponse.json(orderSummary, { status: 200 });

    } catch (error) {
        console.error("Error retrieving checkout session:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}