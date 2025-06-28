'use client';

import { Product } from "@/app/types/types";
import { useRouter } from "next/navigation";
import Button from "./Button";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { signOut } from "next-auth/react";

interface AddToCartButtonProps {
    product: Product;
    quantity: number;
    className?: string;
}

export default function AddToCartButton({ product, quantity, className }: AddToCartButtonProps) {
    const { user, refreshUser } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    
    // Ensure quantityOptions exists and quantity is valid
    const quantityOptions = product.quantityOptions || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const validQuantity = quantityOptions.includes(quantity) ? quantity : quantityOptions[0] || 1;

    const addToCart = async () => {
        console.log("AddToCart clicked", { user: user?.uid, product: product.id, quantity: validQuantity });
        setLoading(true);
        // If user is not logged in, then open login sidebar
        if (!user) {
            console.log("User not logged in, redirecting to login");
            // Open login sidebar
            router.push("?login=true");
            setLoading(false);
            return;
        } else {
            console.log("User is logged in, proceeding with add to cart");

            // Check if product is already in cart
            const get_repsonse = await fetch(`/api/v1/user/cart?id=${user.uid}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (get_repsonse.status === 401) {
                // Token expired, automatically sign out
                console.log("Session expired, signing out...");
                await signOut({ redirect: false });
                setLoading(false);
                return;
            }

            const data = await get_repsonse.json();
            const cartItems = data.data;

            const existingItem = cartItems.find((item: { id: string; quantity: number; }) => item.id === product.id);

            // if product is already in cart, PUT quantity + 1
            if (existingItem) {
                const response = await fetch(`/api/v1/user/cart`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId: user.uid,
                        productId: product.id,
                        quantity: existingItem.quantity + validQuantity,
                    }),
                })

                if (response.status === 401) {
                    console.log("Session expired, signing out...");
                    await signOut({ redirect: false });
                    setLoading(false);
                    return;
                }

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
                    quantity: validQuantity,
                }

                const response = await fetch(`/api/v1/user/cart`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(newItem),
                })

                if (response.status === 401) {
                    console.log("Session expired, signing out...");
                    await signOut({ redirect: false });
                    setLoading(false);
                    return;
                }

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
        <Button loading={loading} text="Add To Cart" onClick={() => addToCart()} className={className} />
    )
}