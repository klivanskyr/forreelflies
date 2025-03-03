"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutSuccess() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [loading, setLoading] = useState(true);
    const [_, setOrderDetails] = useState(null);

    useEffect(() => {
        if (sessionId) {
            async function fetchSession() {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout/session?session_id=${sessionId}`);
                const data = await response.json();
                setOrderDetails(data);
                setLoading(false);
            }
            fetchSession();
        }
    }, [sessionId]);

    if (loading) return <p>Loading order details...</p>;
    return <h1>Payment Successful! 🎉</h1>;
}
