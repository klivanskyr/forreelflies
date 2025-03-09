import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
            return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
        }

        // Fetch the checkout session details from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        return NextResponse.json({ session }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
    }
}