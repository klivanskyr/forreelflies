'use client';

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { FiShoppingCart } from "react-icons/fi";

export default function CartIcon() {
    const { data: session } = useSession();
    const [numItemsInCart, setNumItemsInCart] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const lastFetchTime = useRef<number>(0);
    const fetchTimeoutRef = useRef<NodeJS.Timeout>();

    const fetchCartItemsAmount = useCallback(async () => {
        if (!session?.user?.uid || isLoading) return;

        // Debounce: don't fetch more than once every 2 seconds
        const now = Date.now();
        if (now - lastFetchTime.current < 2000) {
            return;
        }

        try {
            setIsLoading(true);
            lastFetchTime.current = now;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/cart?id=${session.user.uid}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 401) {
                // Token expired, automatically sign out
                console.log("Session expired, signing out...");
                await signOut({ redirect: false });
                return;
            }

            if (response.ok) {
                const json = await response.json();
                const data = json.data;
                if (data) {
                    setNumItemsInCart(data.length);
                }
            }
        } catch (error) {
            console.error("Error fetching cart items:", error);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user?.uid, isLoading]);

    useEffect(() => {
        // Clear any existing timeout
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }

        // Only fetch if we have a session
        if (session?.user?.uid) {
            // Add a small delay to prevent rapid successive calls
            fetchTimeoutRef.current = setTimeout(() => {
                fetchCartItemsAmount();
            }, 100);
        } else {
            // Clear cart count when no session
            setNumItemsInCart(0);
        }

        // Cleanup timeout on unmount
        return () => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, [session?.user?.uid, fetchCartItemsAmount]);

    return (
        <Link href="/cart" className="relative">
            <FiShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
            {session?.user && numItemsInCart > 0 && (
                <div className="absolute top-0 right-0 translate-x-[70%] -translate-y-[60%]">
                    <div className="bg-blue-400 rounded-full w-[15px] h-[15px] md:w-[17px] md:h-[17px] flex items-center justify-center">
                        <p className="text-[10px] md:text-xs font-medium text-white">{numItemsInCart}</p>
                    </div>
                </div>
            )}
        </Link>
    );
} 