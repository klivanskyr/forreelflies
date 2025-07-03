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
import toast from "react-hot-toast";

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
    isSubmitting: boolean;
    input: T;
    setInput: (input: T) => void;
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    vendorId: string;
}

export default function StoreManagerProductModal({ handleSubmit, isSubmitting, input, setInput, modalOpen, setModalOpen }: Props<ProductInput>) {    
    const stockStatusOptions = [
        { value: "inStock", label: "In Stock" },
        { value: "outOfStock", label: "Out of Stock" },
        { value: "unknown", label: "Unknown" }
    ];

    const [uploading, setUploading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"basic" | "inventory">("basic");

    // File validation constants
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_FILES = 10;
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

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

    // Validate and handle file selection
    const handleFileSelection = (files: FileList | null) => {
        if (!files) return;

        const fileArray = Array.from(files);
        const validFiles: File[] = [];
        const errors: string[] = [];

        // Check file count
        if (fileArray.length > MAX_FILES) {
            toast.error(`Maximum ${MAX_FILES} images allowed. Please select fewer files.`);
            return;
        }

        // Validate each file
        fileArray.forEach((file, index) => {
            // Check file type
            if (!ALLOWED_TYPES.includes(file.type)) {
                errors.push(`File ${index + 1}: Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.`);
                return;
            }

            // Check file size
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`File ${index + 1}: File size too large. Maximum size is 10MB.`);
                return;
            }

            // Check file name length
            if (file.name.length > 100) {
                errors.push(`File ${index + 1}: File name too long. Please rename to less than 100 characters.`);
                return;
            }

            validFiles.push(file);
        });

        // Show errors if any
        if (errors.length > 0) {
            errors.forEach(error => toast.error(error));
            if (validFiles.length === 0) return;
            toast.success(`${validFiles.length} valid images selected.`);
        }

        // Update state with valid files
        setInput({ ...input, images: validFiles });
    };

    // Remove image
    const removeImage = (idx: number) => {
        const newFiles = input.images.filter((_, i) => i !== idx);
        setInput({ ...input, images: newFiles });
        toast.success("Image removed");
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
        try {
            setUploading(true);
            let imageUrls: string[] = [];
            
            if (input.images && input.images.length > 0) {
                toast.loading(`Uploading ${input.images.length} images...`, { id: 'upload-toast' });
                
                const uploadPromises = input.images.map(async (file, index) => {
                    try {
                        const url = await uploadFileAndGetUrl(file, `products/${input.name}_${Date.now()}_${file.name}`);
                        return url;
                    } catch (uploadError) {
                        console.error(`Failed to upload image ${index + 1}:`, uploadError);
                        throw new Error(`Failed to upload image "${file.name}"`);
                    }
                });

                try {
                    imageUrls = await Promise.all(uploadPromises);
                    toast.success(`Successfully uploaded ${imageUrls.length} images!`, { id: 'upload-toast' });
                } catch (uploadError) {
                    toast.error(`Image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`, { id: 'upload-toast' });
                    setUploading(false);
                    return;
                }
            }
            
            setUploading(false);
            // Call handleSubmit with imageUrls
            handleSubmit(imageUrls);
        } catch (error) {
            console.error("Error in handleSave:", error);
            toast.error("Failed to process product data. Please try again.");
            setUploading(false);
        }
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

    const isProcessing = uploading || isSubmitting;

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
                                disabled={isProcessing}
                            />
                            
                            <Textarea 
                                label="Short Description" 
                                value={input.shortDescription} 
                                onChange={(e) => setInput({ ...input, shortDescription: e.target.value })} 
                                placeholder="Brief description for product listings (e.g., Classic dry fly pattern for trout)"
                                disabled={isProcessing}
                            />
                            
                            <Textarea 
                                label="Long Description" 
                                value={input.longDescription} 
                                onChange={(e) => setInput({ ...input, longDescription: e.target.value })} 
                                placeholder="Detailed description including materials, techniques, best fishing conditions, etc."
                                disabled={isProcessing}
                            />

                            <TagInput 
                                label="Tags (e.g., dry-fly, trout, mayfly, adams)" 
                                onChange={(newTags: string[]) => setInput({ ...input, tags: newTags })} 
                                selectedTags={input.tags || []} 
                                disabled={isProcessing}
                            />
                            
                            <TagInput 
                                label="Categories (e.g., dry-flies, nymphs, streamers, saltwater)" 
                                onChange={(newCategories: string[]) => setInput({ ...input, catagories: newCategories })} 
                                selectedTags={input.catagories || []} 
                                disabled={isProcessing}
                            />

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Product Images ({input.images?.length || 0}/{MAX_FILES})
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Upload up to {MAX_FILES} images. Max file size: 10MB. Formats: JPEG, PNG, WebP, GIF
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleFileSelection(e.target.files)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                                    disabled={isProcessing}
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
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
                                                    disabled={isProcessing}
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
                                    disabled={isProcessing}
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
                                    disabled={isProcessing}
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
                                disabled={isProcessing}
                            />

                            <Checkbox 
                                label="Track Quantity" 
                                bool={input.trackQuantity} 
                                setBool={(newBool) => setInput({ ...input, trackQuantity: newBool })} 
                                disabled={isProcessing}
                            />

                            {input.trackQuantity && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Stock Quantity" 
                                        value={input.stockQuantity} 
                                        onChange={(e) => setInput({ ...input, stockQuantity: e.target.value })} 
                                        placeholder="Available quantity"
                                        type="number"
                                        disabled={isProcessing}
                                    />
                                    <Input 
                                        label="Low Stock Alert" 
                                        value={input.lowStockThreshold} 
                                        onChange={(e) => setInput({ ...input, lowStockThreshold: e.target.value })} 
                                        placeholder="Alert when stock is low"
                                        type="number"
                                        disabled={isProcessing}
                                    />
                                </div>
                            )}

                            <NumberTagInput 
                                label="Quantity Options *" 
                                selectedNumbers={input.quantityOptions} 
                                onChange={(newNumbers: number[]) => setInput({ ...input, quantityOptions: newNumbers })} 
                                placeholder="Enter quantity (e.g., 1, 3, 6, 12)"
                                disabled={isProcessing}
                            />

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-700">Shipping Information * (inches and pounds)</h3>
                                <p className="text-xs text-gray-500">Required for accurate shipping calculations</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Length *" 
                                        value={input.shippingLength} 
                                        onChange={(e) => setInput({ ...input, shippingLength: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package length"
                                        disabled={isProcessing}
                                    />
                                    <Input 
                                        label="Width *" 
                                        value={input.shippingWidth} 
                                        onChange={(e) => setInput({ ...input, shippingWidth: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package width"
                                        disabled={isProcessing}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Height *" 
                                        value={input.shippingHeight} 
                                        onChange={(e) => setInput({ ...input, shippingHeight: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package height"
                                        disabled={isProcessing}
                                    />
                                    <Input 
                                        label="Weight *" 
                                        value={input.shippingWeight} 
                                        onChange={(e) => setInput({ ...input, shippingWeight: e.target.value })} 
                                        type="number"
                                        step="0.1"
                                        placeholder="Package weight"
                                        disabled={isProcessing}
                                    />
                                </div>
                            </div>

                            {/* Save as Draft moved here */}
                            <div className="border-t pt-4">
                                <Checkbox 
                                    label="Save as Draft" 
                                    bool={input.isDraft} 
                                    setBool={(newBool) => setInput({ ...input, isDraft: newBool })} 
                                    disabled={isProcessing}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Draft products are not visible to customers
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="w-full border-t p-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        {isProcessing && (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span>
                                    {uploading ? "Uploading images..." : "Creating product..."}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            text="Cancel" 
                            onClick={() => setModalOpen(false)} 
                            className="bg-gray-500 hover:bg-gray-600" 
                            disabled={isProcessing}
                        />
                        <Button 
                            text={uploading ? "Uploading..." : isSubmitting ? "Creating..." : "Save Product"} 
                            onClick={handleSave} 
                            disabled={isProcessing}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}