'use client';

import { VendorItem } from "@/app/api/v1/checkout/route";
import Button from "./buttons/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckoutButton({ vendorItems }: { vendorItems: VendorItem[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        try {
            setLoading(true);
            
            // Validate vendorItems before sending
            if (!vendorItems || vendorItems.length === 0) {
                alert("Your cart is empty. Please add some items before checkout.");
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
                alert("Checkout failed: Invalid response from server");
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
                    alert("Checkout failed: No checkout URL received");
                }
            } else {
                // Error case - show error message
                const errorMessage = json.error || "Unknown error occurred";
                console.error("Checkout API error:", errorMessage);
                alert(`Checkout failed: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Checkout request failed:", error);
            alert("Checkout failed: Please check your connection and try again");
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