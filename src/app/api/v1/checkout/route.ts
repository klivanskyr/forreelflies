import { CartItem } from "@/app/cart/page";
import { NextRequest, NextResponse } from "next/server";

import Stripe from "stripe";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
        const { cartItems, connectedAccountId, shippingFee, tax }: { cartItems: CartItem[], connectedAccountId: string, shippingFee: number, tax: number } = await request.json();
        if (!cartItems || !connectedAccountId || !shippingFee || !tax) {
            return NextResponse.json({ error: "Required fields: { cartItems: CartItem[], connectedAccountId: string, shippingFee: number, tax: number }" }, { status: 400 });
        }
        // Check cartItems is CartItem[]
        if (!Array.isArray(cartItems)) {
            return NextResponse.json({ error: "cartItems must be an array" }, { status: 400 });
        }

        const lineItems = cartItems.map((item) => {
            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.product.name,
                    },
                    unit_amount: item.product.price,
                },
                quantity: item.quantity,
            }
        });

        const session = stripe.checkout.sessions.create({
            line_items: lineItems,  
            payment_intent_data: {
                application_fee_amount: 1, // THE AMOUNT TO BE TRANSFERRED TO US. CHANGE TO A PERCENTAGE OF THE TOTAL    
            },
            mode: "payment",
            ui_mode: "embedded",
            success_url: process.env.URL + "/checkout/success",
            cancel_url: process.env.URL + "/cart/",
            return_url: process.env.URL + "/cart", 
        })

    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            return NextResponse.json({ error: "Unknown error" }, { status: 400 });
        }
    }
}