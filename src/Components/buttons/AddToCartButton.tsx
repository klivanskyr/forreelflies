import { Product } from "@/app/types/types";
import { DbUser } from "@/lib/firebase-admin";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ user, product, quantity }: { user: DbUser | null, product: Product, quantity: number }) {
    const router = useRouter();

    const addToCart = async () => {
        // If user is not logged in, then open login sidebar
        if (!user) {
            // Open login sidebar
            router.push("?login=true");
            return;
        } else {
            // Check quanity is one of products quanity options
            if (!product.quantityOptions.includes(quantity)) {
                console.error("Invalid quantity when adding to cart");
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
            } else {
                const data = await response.json();
                const message = data.message;
                console.error("Failed to add to cart", message);
            }
        }
    }
    return (
        <button className="greenButton" onClick={() => addToCart()}>Add To Cart</button>
    )
}