'use client';

import React, { useState } from "react";
import Button from "../buttons/Button";
import Checkbox from "../Checkbox";
import Dropdown from "../inputs/Dropdown";
import Input from "../inputs/Input";
import TagInput from "../inputs/TagInput";
import NumberTagInput from "../inputs/NumberTagInput";
import Modal from "../modal/Modal";
import Textarea from "../Textarea";
import { StockStatus } from "@/app/types/types";
import { uploadFileAndGetUrl } from "@/lib/firebase";

export interface ProductInput {
    name: string;
    shortDescription: string;
    longDescription: string;
    price: string;
    originalPrice: string;
    discountPercentage: string;
    stockStatus: string;
    stockQuantity: string;
    lowStockThreshold: string;
    trackQuantity: boolean;
    quantityOptions: number[];
    tags: string[];
    catagories: string[];
    isDraft: boolean;
    images: File[];
    shippingWeight: string;
    shippingLength: string;
    shippingWidth: string;
    shippingHeight: string;
}

interface Props<T> {
    handleSubmit: (imageUrls: string[]) => void;
    errorMessage: string;
    input: T;
    setInput: (input: T) => void;
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    vendorId: string;
}

export default function StoreManagerProductModal({ handleSubmit, errorMessage, input, setInput, modalOpen, setModalOpen }: Props<ProductInput>) {    
    const stockStatusOptions = [
        { value: "inStock", label: "In Stock" },
        { value: "outOfStock", label: "Out of Stock" },
        { value: "unknown", label: "Unknown" }
    ];

    const [uploading, setUploading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"basic" | "inventory">("basic");

    // Preview selected images
    React.useEffect(() => {
        if (input.images && input.images.length > 0) {
            const urls = input.images.map((file) => URL.createObjectURL(file));
            setImagePreviews(urls);
            return () => urls.forEach(url => URL.revokeObjectURL(url));
        } else {
            setImagePreviews([]);
        }
    }, [input.images]);

    // Remove image
    const removeImage = (idx: number) => {
        const newFiles = input.images.filter((_, i) => i !== idx);
        setInput({ ...input, images: newFiles });
    };

    // Calculate discount percentage when prices change
    const calculateDiscountPercentage = (originalPrice: string, currentPrice: string) => {
        const original = parseFloat(originalPrice);
        const current = parseFloat(currentPrice);
        if (original > 0 && current > 0 && original > current) {
            return Math.round(((original - current) / original) * 100).toString();
        }
        return "";
    };



    // Handle save: upload images, get URLs, then call handleSubmit
    const handleSave = async () => {
        setUploading(true);
        let imageUrls: string[] = [];
        if (input.images && input.images.length > 0) {
            imageUrls = await Promise.all(
                input.images.map((file) => uploadFileAndGetUrl(file, `products/${input.name}_${Date.now()}_${file.name}`))
            );
        }
        setUploading(false);
        // Call handleSubmit with imageUrls
        handleSubmit(imageUrls);
    };

    const TabButton = ({ tab, label }: { tab: typeof activeTab, label: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab 
                    ? 'bg-blue-600 text-white border-b-2 border-blue-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
            {label}
        </button>
    );

    return (
        <Modal open={modalOpen} setOpen={setModalOpen} className="w-[85%] h-[95%] rounded-xl flex flex-col justify-between">
            <div className="w-full h-full flex flex-col items-center overflow-hidden">
                <div className="w-full p-4 border-b">
                    <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                    
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 border-b">
                        <TabButton tab="basic" label="Basic Info" />
                        <TabButton tab="inventory" label="Inventory & Pricing" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 w-full">
                    {/* Basic Info Tab */}
                    {activeTab === "basic" && (
                        <div className="w-full max-w-2xl space-y-4">
                            <Input 
                                className="w-full" 
                                label="Product Name *" 
                                value={input.name} 
                                onChange={(e) => setInput({ ...input, name: e.target.value })} 
                                placeholder="Enter product name (e.g., Adams Dry Fly #14)"
                            />
                            
                            <Textarea 
                                label="Short Description" 
                                value={input.shortDescription} 
                                onChange={(e) => setInput({ ...input, shortDescription: e.target.value })} 
                                placeholder="Brief description for product listings (e.g., Classic dry fly pattern for trout)"
                            />
                            
                            <Textarea 
                                label="Long Description" 
                                value={input.longDescription} 
                                onChange={(e) => setInput({ ...input, longDescription: e.target.value })} 
                                placeholder="Detailed description including materials, techniques, best fishing conditions, etc."
                            />

                            <TagInput 
                                label="Tags (e.g., dry-fly, trout, mayfly, adams)" 
                                onChange={(newTags: string[]) => setInput({ ...input, tags: newTags })} 
                                selectedTags={input.tags || []} 
                            />
                            
                            <TagInput 
                                label="Categories (e.g., dry-flies, nymphs, streamers, saltwater)" 
                                onChange={(newCategories: string[]) => setInput({ ...input, catagories: newCategories })} 
                                selectedTags={input.catagories || []} 
                            />

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Product Images</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setInput({ ...input, images: files });
                                    }}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                
                                {/* Image Previews */}
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {imagePreviews.map((url, idx) => (
                                            <div key={idx} className="relative">
                                                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Inventory & Pricing Tab */}
                    {activeTab === "inventory" && (
                        <div className="w-full max-w-2xl space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <h3 className="font-medium text-blue-900 mb-2">Pricing & Discounts:</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li><strong>Current Price:</strong> The price customers will pay</li>
                                    <li><strong>Original Price:</strong> Set if offering a discount (optional)</li>
                                    <li><strong>Discount:</strong> Automatically calculated percentage off</li>
                                </ul>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Current Price *" 
                                    value={input.price} 
                                    onChange={(e) => {
                                        const newPrice = e.target.value;
                                        const discount = calculateDiscountPercentage(input.originalPrice, newPrice);
                                        setInput({ ...input, price: newPrice, discountPercentage: discount });
                                    }} 
                                    placeholder="0.00"
                                    type="number"
                                    step="0.01"
                                />
                                <Input 
                                    label="Original Price (for discounts)" 
                                    value={input.originalPrice} 
                                    onChange={(e) => {
                                        const newOriginal = e.target.value;
                                        const discount = calculateDiscountPercentage(newOriginal, input.price);
                                        setInput({ ...input, originalPrice: newOriginal, discountPercentage: discount });
                                    }} 
                                    placeholder="Leave empty if no discount"
                                    type="number"
                                    step="0.01"
                                />
                            </div>

                            {/* Discount Display */}
                            {input.originalPrice && parseFloat(input.originalPrice) > parseFloat(input.price || "0") && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-green-800 font-medium">
                                            Discount: {input.discountPercentage}% off
                                        </span>
                                        <span className="text-green-600 text-sm">
                                            Savings: ${(parseFloat(input.originalPrice) - parseFloat(input.price || "0")).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Dropdown 
                                label="Stock Status" 
                                selected={stockStatusOptions.find(option => option.value === input.stockStatus) || stockStatusOptions[2]}
                                options={stockStatusOptions}
                                setSelected={(newSelected: string) => setInput({ ...input, stockStatus: newSelected as StockStatus })}
                            />

                            <Checkbox 
                                label="Track Quantity" 
                                bool={input.trackQuantity} 
                                setBool={(newBool) => setInput({ ...input, trackQuantity: newBool })} 
                            />

                            {input.trackQuantity && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Stock Quantity" 
                                        value={input.stockQuantity} 
                                        onChange={(e) => setInput({ ...input, stockQuantity: e.target.value })} 
                                        placeholder="Available quantity"
                                        type="number"
                                    />
                                    <Input 
                                        label="Low Stock Alert" 
                                        value={input.lowStockThreshold} 
                                        onChange={(e) => setInput({ ...input, lowStockThreshold: e.target.value })} 
                                        placeholder="Alert when stock is low"
                                        type="number"
                                    />
                                </div>
                            )}

                            <NumberTagInput 
                                label="Quantity Options" 
                                selectedNumbers={input.quantityOptions} 
                                onChange={(newNumbers: number[]) => setInput({ ...input, quantityOptions: newNumbers })} 
                                placeholder="Enter quantity (e.g., 1, 3, 6, 12)"
                            />

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-700">Shipping Information (inches and pounds)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Length" 
                                        value={input.shippingLength} 
                                        onChange={(e) => setInput({ ...input, shippingLength: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package length"
                                    />
                                    <Input 
                                        label="Width" 
                                        value={input.shippingWidth} 
                                        onChange={(e) => setInput({ ...input, shippingWidth: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package width"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Height" 
                                        value={input.shippingHeight} 
                                        onChange={(e) => setInput({ ...input, shippingHeight: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package height"
                                    />
                                    <Input 
                                        label="Weight" 
                                        value={input.shippingWeight} 
                                        onChange={(e) => setInput({ ...input, shippingWeight: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package weight"
                                    />
                                </div>
                            </div>

                            {/* Save as Draft moved here */}
                            <div className="border-t pt-4">
                                <Checkbox 
                                    label="Save as Draft" 
                                    bool={input.isDraft} 
                                    setBool={(newBool) => setInput({ ...input, isDraft: newBool })} 
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Draft products are not visible to customers
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="w-full border-t p-4 flex justify-between items-center">
                    <div className="text-red-500 text-sm">{errorMessage}</div>
                    <div className="flex gap-2">
                        <Button text="Cancel" onClick={() => setModalOpen(false)} className="bg-gray-500 hover:bg-gray-600" />
                        <Button text={uploading ? "Uploading..." : "Save Product"} onClick={handleSave} disabled={uploading} />
                    </div>
                </div>
            </div>
        </Modal>
    );
}