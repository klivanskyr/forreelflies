'use client';

import { VendorItem } from "@/app/api/v1/checkout/route";
import Button from "./buttons/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function CheckoutButton({ vendorItems }: { vendorItems: VendorItem[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        try {
            setLoading(true);
            
            // Validate vendorItems before sending
            if (!vendorItems || vendorItems.length === 0) {
                toast.error("Your cart is empty. Please add some items before checkout.");
                return;
            }
            
            console.log("Starting checkout with vendorItems:", vendorItems);

            const response = await fetch(`/api/v1/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    vendorItems,
                }),
            });

            console.log("Checkout API response status:", response.status);
            
            // Get response text first to handle both JSON and non-JSON responses
            const responseText = await response.text();
            console.log("Checkout API response text:", responseText);
            
            let json;
            try {
                json = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Failed to parse response as JSON:", parseError);
                toast.error("Checkout failed: Invalid response from server");
                return;
            }

            console.log("Parsed checkout response:", json);

            if (response.ok) {
                if (json.data && json.data.url) {
                    console.log("Redirecting to Stripe checkout:", json.data.url);
                    // Success case - redirect to Stripe checkout
                    router.push(json.data.url);
                } else {
                    console.error("Success response but missing URL:", json);
                    toast.error("Checkout failed: No checkout URL received");
                }
            } else {
                // Error case - show specific error message
                const errorMessage = json.error || "Unknown error occurred";
                console.error("Checkout API error:", errorMessage);
                
                // Show appropriate error message based on error type
                if (errorMessage.includes("shipping service")) {
                    toast.error("Shipping service temporarily unavailable. Please try again in a few minutes.");
                } else if (errorMessage.includes("stock")) {
                    toast.error("Some items in your cart are out of stock. Please update your cart and try again.");
                } else if (errorMessage.includes("price")) {
                    toast.error("Product prices have changed. Please refresh your cart and try again.");
                } else if (errorMessage.includes("Stripe")) {
                    toast.error("Payment system temporarily unavailable. Please try again later.");
                } else {
                    toast.error(`Checkout failed: ${errorMessage}`);
                }
            }
        } catch (error) {
            console.error("Checkout request failed:", error);
            
            // Network or connection error
            if (error instanceof TypeError && error.message.includes("fetch")) {
                toast.error("Connection error. Please check your internet connection and try again.");
            } else {
                toast.error("Checkout failed: Please try again in a few moments.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button 
            text={loading ? "Processing..." : "Proceed to Checkout"} 
            onClick={handleCheckout}
            disabled={loading || !vendorItems || vendorItems.length === 0}
        />
    );
}