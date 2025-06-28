'use client';

import { Product } from "@/app/types/types";
import AddToCartButton from "./AddToCartButton";

interface ClientAddToCartButtonProps {
    product: Product;
    quantity?: number;
    className?: string;
}

export default function ClientAddToCartButton({ product, quantity, className }: ClientAddToCartButtonProps) {
    const quantityOptions = product.quantityOptions || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const validQuantity = quantity && quantityOptions.includes(quantity) ? quantity : quantityOptions[0] || 1;
    
    return <AddToCartButton product={product} quantity={validQuantity} className={className} />;
} 