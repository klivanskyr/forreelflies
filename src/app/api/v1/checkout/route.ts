import { CartItem } from "@/app/cart/page";
import { NextRequest, NextResponse } from "next/server";

import Stripe from "stripe";

export type VendorItem = {
    vendorId: string;
    stripeAccountId: string;
    cartItems: CartItem[];
    shippingFee: number;
};

type LineItem = {
    price_data: {
        currency: string;
        product_data: {
            name: string;
            images: string[] | undefined;
            description: string | undefined;
        };
        unit_amount: number;
    };
    quantity: number;
};

type VendorDetails = {
    vendorId: string;
    stripeAccountId: string;
    amount: number;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

        // Extract vendorItems from the request body
        const { vendorItems }: { vendorItems: VendorItem[] } = await request.json();

        if (!vendorItems || vendorItems.length === 0) {
            return NextResponse.json({ error: "Required field: vendorItems (array)" }, { status: 400 });
        }

        // verify the vendorItems array follows the correct structure
        for (const vendor of vendorItems) {
            if (!vendor.vendorId || !vendor.stripeAccountId || !vendor.cartItems || !vendor.shippingFee) {
                return NextResponse.json({ error: "Each vendor item must have: vendorId, stripeAccountId, cartItems, shippingFee" }, { status: 400 });
            }
        }

        let totalAmountCents = 0;
        let totalShippingfeeCents = 0;
        const lineItems: LineItem[] = [];
        let vendorDetails: VendorDetails[] = [];

        // Process each vendor's items
        for (const vendor of vendorItems) {
            if (!vendor.cartItems || vendor.cartItems.length === 0) {
                return NextResponse.json({ error: `Vendor ${vendor.vendorId} has no cart items` }, { status: 400 });
            }

            if (!vendor.stripeAccountId) {
                return NextResponse.json({ error: `Vendor ${vendor.vendorId} is missing Stripe Account ID` }, { status: 400 });
            }

            let vendorTotal = 0;

            // Convert items into Stripe line items
            vendor.cartItems.forEach((item) => {
                const itemTotalCents = item.product.price * item.quantity * 100; // Convert price to cents
                lineItems.push({
                    price_data: {
                        currency: "usd",
                        product_data: { 
                            name: item.product.name ,
                            images: item.product.images,
                            description: item.product.shortDescription
                        },
                        unit_amount: itemTotalCents / item.quantity,
                    },
                    quantity: item.quantity,
                });

                vendorTotal += itemTotalCents;
            });

            // Add vendorTotal to totalAmount
            totalAmountCents += vendorTotal;

            // Add shipping fee to totalShippingfee
            totalShippingfeeCents += vendor.shippingFee * 100; //Convert to cents

            // Store vendor details for transfer processing
            vendorDetails.push({
                vendorId: vendor.vendorId,
                stripeAccountId: vendor.stripeAccountId,
                amount: vendorTotal,
            });
        }

        // Calculate platform fee (10% of total)
        // const applicationFeeAmount = Math.round(totalAmountCents * 0.1);

        // Create a single Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            payment_intent_data: {
                // application_fee_amount: applicationFeeAmount, // Platform fee Application fee is now in the transfor stage
                // metadata: {
                //     vendorDetails: JSON.stringify(vendorDetails), // Store vendor details for transfers
                // },
            },
            metadata: {
                vendorDetails: JSON.stringify(vendorDetails), // Store vendor details for transfers
            },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: "fixed_amount",
                        fixed_amount: { amount: totalShippingfeeCents, currency: "usd" }, 
                        display_name: "Multi-Vendor Shipping",
                    },
                },
            ],
            mode: "payment",
            ui_mode: "hosted",
            success_url: `${process.env.URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.URL}/checkout/cancel`,
        });

        console.log("session", session);

        return NextResponse.json({ data: { url: session.url }}, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
    }
}