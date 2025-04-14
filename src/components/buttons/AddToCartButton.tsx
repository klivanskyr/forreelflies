'use client';

import { Product } from "@/app/types/types";
import { useRouter } from "next/navigation";
import Button from "./Button";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";

export default function AddToCartButton({ product, quantity }: { product: Product, quantity: number }) {
    const { user, refreshUser } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);

    const addToCart = async () => {
        setLoading(true);
        // If user is not logged in, then open login sidebar
        if (!user) {
            // Open login sidebar
            router.push("?login=true");
            setLoading(false);
            return;
        } else {
            // Check quanity is one of products quanity options
            if (!product.quantityOptions.includes(quantity)) {
                console.error("Invalid quantity when adding to cart");
                setLoading(false);
                return;
            }

            const newItem = {
                userId: user.uid,
                productId: product.id,
                quantity: quantity,
            }

            // Update user's cart
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/cart`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newItem),
            })

            if (response.ok) {
                console.log("Added to cart");
                refreshUser();
                setLoading(false);
                return;
            } else {
                const data = await response.json();
                const message = data.message;
                console.error("Failed to add to cart", message);
                setLoading(false);
                return;
            }
        }
    }

    return (
        <Button loading={loading} text="Add To Cart" onClick={() => addToCart()} />
    )
}