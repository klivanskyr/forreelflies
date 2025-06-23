'use client';

import { Product } from "@/app/types/types";
import { useState } from "react";
import { IoHeartCircleOutline } from "react-icons/io5";
import { FaMinus, FaPlus } from "react-icons/fa";
import AddToCartButton from "../buttons/AddToCartButton";

export default function ProductInfo({ product }: { product: Product }) {
    // Provide default quantity options if not specified
    const quantityOptions = product.quantityOptions || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    const dropdownQuantityOptions = quantityOptions.map((option) => {
        return {
            value: option.toString(),
            label: option.toString(),
        }
    }).sort((a, b) => (parseInt(a.value) > parseInt(b.value) ? 1 : -1));

    const [selectedQuantity, setSelectedQuantity] = useState(dropdownQuantityOptions[0]?.value || '1')

    // Check if product has a discount
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount && product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Quantity Selector */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    Quantity
                </label>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                        <button 
                            className="p-2 hover:bg-gray-50 transition-colors"
                            onClick={() => {
                                const currentIndex = dropdownQuantityOptions.findIndex(opt => opt.value === selectedQuantity);
                                if (currentIndex > 0) {
                                    setSelectedQuantity(dropdownQuantityOptions[currentIndex - 1].value);
                                }
                            }}
                            disabled={selectedQuantity === dropdownQuantityOptions[0]?.value}
                        >
                            <FaMinus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span className="px-4 py-2 text-center min-w-[60px] font-medium">
                            {selectedQuantity}
                        </span>
                        <button 
                            className="p-2 hover:bg-gray-50 transition-colors"
                            onClick={() => {
                                const currentIndex = dropdownQuantityOptions.findIndex(opt => opt.value === selectedQuantity);
                                if (currentIndex < dropdownQuantityOptions.length - 1 && currentIndex !== -1) {
                                    setSelectedQuantity(dropdownQuantityOptions[currentIndex + 1].value);
                                }
                            }}
                            disabled={selectedQuantity === dropdownQuantityOptions[dropdownQuantityOptions.length - 1]?.value}
                        >
                            <FaPlus className="w-3 h-3 text-gray-600" />
                        </button>
                    </div>
                    <span className="text-sm text-gray-500">
                        {(product.stockStatus === 'inStock' || !product.stockStatus) ? 'In Stock' : 'Out of Stock'}
                    </span>
                </div>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-3">
                <AddToCartButton 
                    product={product} 
                    quantity={parseInt(selectedQuantity)}
                />
                
                {/* Secondary Actions */}
                <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                        <IoHeartCircleOutline className="w-5 h-5" />
                        <span>Add to Wishlist</span>
                    </button>
                </div>
            </div>


        </div>
    )
}