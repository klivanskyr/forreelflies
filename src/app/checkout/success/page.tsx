"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

function CheckoutSuccess(): JSX.Element {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [loading, setLoading] = useState(true);
    const [orderDetails, setOrderDetails] = useState(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) {
            const errorMessage = "No session ID provided in URL";
            console.error("Checkout success page error:", errorMessage);
            toast.error("Order confirmation unavailable. Please check your email for order details.");
            setError(errorMessage);
            setLoading(false);
            return;
        }

        async function fetchSession() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout/session?session_id=${sessionId}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Failed to fetch session:", response.status, errorText);
                    
                    if (response.status === 404) {
                        toast.error("Order session not found. Please check your email for order confirmation.");
                    } else if (response.status >= 500) {
                        toast.error("Server error loading order details. Please try refreshing the page.");
                    } else {
                        toast.error("Unable to load order confirmation. Please check your email for order details.");
                    }
                    
                    setError(`Failed to load order details (${response.status})`);
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                
                if (!data || typeof data !== 'object') {
                    console.error("Invalid session data received:", data);
                    toast.error("Invalid order data received. Please contact support if you need order details.");
                    setError("Invalid order data");
                    setLoading(false);
                    return;
                }

                setOrderDetails(data);
                toast.success("Order confirmed successfully!");
                setLoading(false);
            } catch (networkError) {
                console.error("Network error fetching session:", networkError);
                
                if (networkError instanceof TypeError && networkError.message.includes("fetch")) {
                    toast.error("Connection error. Please check your internet connection and refresh the page.");
                } else {
                    toast.error("Unable to load order confirmation. Please check your email for order details.");
                }
                
                setError("Network error loading order details");
                setLoading(false);
            }
        }
        
        fetchSession();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <h1 className="text-xl">Loading order confirmation...</h1>
            </div>
        );
    } 

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Unable to Load Order Details</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500 mb-6">
                        Don't worry - your order was likely processed successfully. 
                        Please check your email for order confirmation details.
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mr-4"
                    >
                        Try Again
                    </button>
                    <a 
                        href="/my-account/orders" 
                        className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
                    >
                        View My Orders
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold mb-4">Thank you for your purchase!</h1>
            <p className="text-lg">Your order has been successfully processed.</p>
            {orderDetails && (
                <div className="mt-4 text-center">
                    <p className="text-lg">Order confirmation has been sent to your email.</p>
                    <a 
                        href="/my-account/orders" 
                        className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                        View Order Details
                    </a>
                </div>
            )}
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <h1 className="text-xl">Loading...</h1>
            </div>
        }>
            <CheckoutSuccess />
        </Suspense>
    );
}