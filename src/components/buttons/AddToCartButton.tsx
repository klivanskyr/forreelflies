'use client';

import { Product } from "@/app/types/types";
import { useRouter } from "next/navigation";
import Button from "./Button";
import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { signOut } from "next-auth/react";
import toast from "react-hot-toast";

interface AddToCartButtonProps {
    product: Product;
    quantity: number;
    className?: string;
}

export default function AddToCartButton({ product, quantity, className }: AddToCartButtonProps) {
    const { user, refreshUser } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    
    // Remove the quantity validation since we now handle it in the ProductInfo component
    const validQuantity = quantity;

    const addToCart = async () => {
        console.log("AddToCart clicked", { user: user?.uid, product: product.id, quantity: validQuantity });
        setLoading(true);
        // If user is not logged in, then open login sidebar
        if (!user) {
            console.log("User not logged in, redirecting to login");
            toast.error("Please sign in to add items to your cart");
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
                toast.error("Your session has expired. Please sign in again.");
                await signOut({ redirect: false });
                setLoading(false);
                return;
            }

            if (!get_repsonse.ok) {
                console.error("Failed to fetch cart");
                toast.error("Failed to load cart. Please try again.");
                setLoading(false);
                return;
            }

            const data = await get_repsonse.json();
            const cartItems = data.data;

            const existingItem = cartItems.find((item: { id: string; quantity: number; }) => item.id === product.id);

            // if product is already in cart, PUT quantity + validQuantity
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
                    toast.error("Your session has expired. Please sign in again.");
                    await signOut({ redirect: false });
                    setLoading(false);
                    return;
                }

                if (response.ok) {
                    console.log("Updated cart");
                    toast.success(`Updated ${product.name} quantity in cart`);
                    refreshUser();
                    setLoading(false);
                } else {
                    const data = await response.json();
                    const message = data.message || data.error || "Failed to update cart";
                    console.error("Failed to update cart", message);
                    toast.error(message);
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
                    toast.error("Your session has expired. Please sign in again.");
                    await signOut({ redirect: false });
                    setLoading(false);
                    return;
                }

                if (response.ok) {
                    console.log("Added to cart");
                    toast.success(`Added ${product.name} to cart!`);
                    refreshUser();
                    setLoading(false);
                } else {
                    const data = await response.json();
                    const message = data.message || data.error || "Failed to add to cart";
                    console.error("Failed to add to cart", message);
                    toast.error(message);
                    setLoading(false);
                }
            }
        }
    }

    return (
        <Button loading={loading} text="Add To Cart" onClick={() => addToCart()} className={className} />
    )
}