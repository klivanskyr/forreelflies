'use client';

import { Product } from "@/app/types/types";
import { useState, useEffect } from "react";
import { IoHeartCircleOutline } from "react-icons/io5";
import { FaMinus, FaPlus } from "react-icons/fa";
import AddToCartButton from "../buttons/AddToCartButton";
import Dropdown from "../inputs/Dropdown";
import Stars from "../cards/Stars";
import Link from "next/link";

export default function ProductInfo({ product }: { product: Product }) {
    // Get the base quantities from product options or default to [1]
    const baseQuantities = product.quantityOptions || [1];
    
    // Create dropdown options from base quantities
    const baseOptions = baseQuantities.map(qty => ({
        value: qty.toString(),
        label: qty.toString()
    }));

    // State for selected base quantity and multiplier
    const [selectedBase, setSelectedBase] = useState(baseOptions[0]);
    const [multiplierInput, setMultiplierInput] = useState("1");
    const [vendorReviews, setVendorReviews] = useState<{ averageRating: number; totalReviews: number; }>({ averageRating: 0, totalReviews: 0 });
    
    // Parse multiplier for calculations, defaulting to 1 if invalid
    const multiplier = parseInt(multiplierInput) || 1;
    
    // Calculate actual quantity
    const actualQuantity = parseInt(selectedBase.value) * multiplier;
    
    // Calculate max quantity based on stock if tracking is enabled
    const maxQuantity = product.trackQuantity && product.stockQuantity 
        ? product.stockQuantity 
        : 1000; // Set a reasonable maximum if not tracking

    // Calculate max multiplier based on maxQuantity and selected base
    const maxMultiplier = Math.floor(maxQuantity / parseInt(selectedBase.value));

    useEffect(() => {
        const fetchVendorReviews = async () => {
            try {
                const res = await fetch(`/api/v1/vendor/reviews?vendorId=${product.vendorId}&pageSize=1`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.summary) {
                        setVendorReviews({
                            averageRating: data.summary.averageRating || 0,
                            totalReviews: data.summary.totalReviews || 0
                        });
                    }
                }
            } catch (err) {
                console.log('Vendor reviews not available');
            }
        };

        fetchVendorReviews();
    }, [product.vendorId]);

    const handleIncrement = () => {
        if (multiplier < maxMultiplier) {
            setMultiplierInput((multiplier + 1).toString());
        }
    };

    const handleDecrement = () => {
        if (multiplier > 1) {
            setMultiplierInput((multiplier - 1).toString());
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow empty input for better typing experience
        if (value === "") {
            setMultiplierInput("");
            return;
        }
        
        // Only update if it's a valid number
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
            if (numValue >= 1 && numValue <= maxMultiplier) {
                setMultiplierInput(numValue.toString());
            } else if (numValue > maxMultiplier) {
                setMultiplierInput(maxMultiplier.toString());
            }
        }
    };

    // Handle blur to ensure valid value when user finishes typing
    const handleBlur = () => {
        if (multiplierInput === "" || parseInt(multiplierInput) < 1) {
            setMultiplierInput("1");
        }
    };

    // Check if product has a discount
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount && product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Vendor Info */}
            <div className="flex items-center gap-2">
                <Link href={`/vendor/${product.vendorId}`} className="text-lg font-medium hover:text-green-600 transition-colors">
                    {product.vendorName}
                </Link>
                {vendorReviews.totalReviews > 0 && (
                    <div className="flex items-center gap-2">
                        <Stars rating={vendorReviews.averageRating} className="text-lg" />
                        <span className="text-sm text-gray-600">
                            ({vendorReviews.totalReviews})
                        </span>
                    </div>
                )}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-900">
                    Base Quantity
                </label>
                <Dropdown
                    options={baseOptions}
                    selected={selectedBase}
                    setSelected={(value) => {
                        const newBase = baseOptions.find(opt => opt.value === value) || baseOptions[0];
                        const oldTotal = parseInt(selectedBase.value) * multiplier;
                        const newBaseValue = parseInt(newBase.value);
                        
                        // Calculate new multiplier to maintain same total (or closest possible)
                        let newMultiplier = Math.floor(oldTotal / newBaseValue);
                        
                        // Ensure multiplier is at least 1 and doesn't exceed max
                        newMultiplier = Math.max(1, Math.min(newMultiplier, Math.floor(maxQuantity / newBaseValue)));
                        
                        setSelectedBase(newBase);
                        setMultiplierInput(newMultiplier.toString());
                    }}
                    classNames={{ select: "w-full" }}
                />
                
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-900">
                        Quantity Multiplier
                    </label>
                    <div className="flex items-center space-x-3 mt-2">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                            <button 
                                className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                onClick={handleDecrement}
                                disabled={multiplier <= 1}
                            >
                                <FaMinus className="w-3 h-3 text-gray-600" />
                            </button>
                            <input
                                type="number"
                                value={multiplierInput}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className="px-4 py-2 text-center w-20 focus:outline-none font-medium"
                                min={1}
                                max={maxMultiplier}
                            />
                            <button 
                                className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                onClick={handleIncrement}
                                disabled={multiplier >= maxMultiplier}
                            >
                                <FaPlus className="w-3 h-3 text-gray-600" />
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            <span>{selectedBase.value} × {multiplier} = {actualQuantity} items</span>
                        </div>
                    </div>
                </div>

                <div className="text-sm">
                    <span className={`${product.stockStatus === 'outOfStock' ? 'text-red-500' : 'text-green-600'}`}>
                        {product.stockStatus === 'outOfStock' ? 'Out of Stock' : 'In Stock'}
                    </span>
                    {product.trackQuantity && product.stockQuantity && (
                        <span className="text-gray-500 ml-2">
                            ({product.stockQuantity} available)
                        </span>
                    )}
                </div>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-3">
                <AddToCartButton 
                    product={product} 
                    quantity={actualQuantity}
                    className={`w-full py-3 px-4 ${
                        product.stockStatus === 'outOfStock' 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                    } text-white rounded-lg transition-colors font-medium`}
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