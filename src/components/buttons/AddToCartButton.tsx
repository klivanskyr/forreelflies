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

            // Check if product is already in cart
            const get_repsonse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/cart?id=${user.uid}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            const data = await get_repsonse.json();
            const cartItems = data.data;

            const existingItem = cartItems.find((item: { id: string; quantity: number; }) => item.id === product.id);

            // if product is already in cart, PUT quantity + 1
            if (existingItem) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/cart`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId: user.uid,
                        productId: product.id,
                        quantity: existingItem.quantity + 1,
                    }),
                })

                if (response.ok) {
                    console.log("Updated cart");
                    refreshUser();
                    setLoading(false);
                } else {
                    const data = await response.json();
                    const message = data.message;
                    console.error("Failed to update cart", message);
                    setLoading(false);
                }
            } else {
                // if product is not in cart, POST
                const newItem = {
                    userId: user.uid,
                    productId: product.id,
                    quantity: quantity,
                }

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
                } else {
                    const data = await response.json();
                    const message = data.message;
                    console.error("Failed to add to cart", message);
                    setLoading(false);
                }
            }
        }
    }

    return (
        <Button loading={loading} text="Add To Cart" onClick={() => addToCart()} />
    )
}