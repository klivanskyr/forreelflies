"use client"; // Required for Next.js App Router

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function CheckoutPage({ clientSecret }: { clientSecret: string }) {
    const [stripeReady, setStripeReady] = useState(false);

    useEffect(() => {
        if (clientSecret) {
            setStripeReady(true);
        }
    }, [clientSecret]);

    if (!stripeReady) {
        return <p>Loading checkout...</p>;
    }

    return (
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
            <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
    );
}
