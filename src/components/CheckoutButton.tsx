'use client';

import { VendorItem } from "@/app/api/v1/checkout/route";
import Button from "./buttons/Button";
import { useRouter } from "next/navigation";

export default function CheckoutButton({ vendorItems }: { vendorItems: VendorItem[] }) {
    const router = useRouter();

    const handleCheckout = async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                vendorItems,
            }),
        });

        const json = await response.json();
        console.log("DATA:", json.data);
        router.push(json.data.url);
    };

    return <Button text="Proceed to Checkout" onClick={() => handleCheckout()} />
}