'use client';

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FiShoppingCart } from "react-icons/fi";

export default function CartIcon() {
    const { data: session } = useSession();
    const [numItemsInCart, setNumItemsInCart] = useState(0);

    useEffect(() => {
        const fetchCartItemsAmount = async () => {
            if (session?.user?.uid) {
                try {
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
                }
            }
        };

        fetchCartItemsAmount();
    }, [session?.user?.uid]);

    return (
        <Link href="/cart" className="relative">
            <FiShoppingCart className="h-6 w-6" />
            {session?.user && numItemsInCart > 0 && (
                <div className="absolute top-0 right-0 translate-x-[70%] -translate-y-[60%]">
                    <div className="bg-blue-400 rounded-full w-[17px] h-[17px] text-center content-center">
                        <p className="text-xs font-medium">{numItemsInCart}</p>
                    </div>
                </div>
            )}
        </Link>
    );
} 