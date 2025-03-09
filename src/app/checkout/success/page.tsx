"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CheckoutSuccess(): JSX.Element {
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

    if (loading) {
        return <div className="flex flex-col items-center justify-center h-screen"><h1>Loading...</h1></div>;
    } 

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold mb-4">Thank you for your purchase!</h1>
            <p className="text-lg">Your order has been successfully processed.</p>
            <p className="text-lg">Order ID: {}</p>
        </div>
    );
}

export default function Page() {
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-screen"><h1>Loading...</h1></div>}>
        <CheckoutSuccess />
    </Suspense>
}