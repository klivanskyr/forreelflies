'use client';

import React, { useState, useEffect } from "react";
import Button from "../buttons/Button";
import Checkbox from "../Checkbox";
import Dropdown from "../inputs/Dropdown";
import Input from "../inputs/Input";
import TagInput from "../inputs/TagInput";
import NumberTagInput from "../inputs/NumberTagInput";
import Modal from "../modal/Modal";
import Textarea from "../Textarea";
import { Product, StockStatus } from "@/app/types/types";
import { uploadFileAndGetUrl } from "@/lib/firebase";

interface Props {
    product: Product | null;
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    onProductUpdated: () => void;
    vendorId: string;
}

interface UpdateProductInput {
    name: string;
    shortDescription: string;
    longDescription: string;
    price: string;
    originalPrice: string;
    discountPercentage: string;
    stockStatus: string;
    quantityOptions: number[];
    tags: string[];
    catagories: string[];
    isDraft: boolean;
    newImages: File[];
    existingImages: string[];
    shippingWeight: string;
    shippingLength: string;
    shippingWidth: string;
    shippingHeight: string;
}

export default function StoreManagerUpdateProductModal({ product, modalOpen, setModalOpen, onProductUpdated, vendorId }: Props) {
    const [input, setInput] = useState<UpdateProductInput>({
        name: "",
        shortDescription: "",
        longDescription: "",
        price: "",
        originalPrice: "",
        discountPercentage: "",
        stockStatus: "unknown",
        quantityOptions: [],
        tags: [],
        catagories: [],
        isDraft: false,
        newImages: [],
        existingImages: [],
        shippingWeight: "",
        shippingLength: "",
        shippingWidth: "",
        shippingHeight: "",
    });

    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

    const stockStatusOptions = [
        { value: "inStock", label: "In Stock" },
        { value: "outOfStock", label: "Out of Stock" },
        { value: "unknown", label: "Unknown" }
    ];

    // Initialize form when product changes
    useEffect(() => {
        if (product && modalOpen) {
            setInput({
                name: product.name || "",
                shortDescription: product.shortDescription || "",
                longDescription: product.longDescription || "",
                price: product.price?.toString() || "",
                originalPrice: product.originalPrice?.toString() || "",
                discountPercentage: product.discountPercentage?.toString() || "",
                stockStatus: product.stockStatus || "unknown",
                quantityOptions: product.quantityOptions?.map(Number) || [],
                tags: product.tags || [],
                catagories: product.catagories || [],
                isDraft: product.isDraft || false,
                newImages: [],
                existingImages: product.images || [],
                shippingWeight: product.shippingWeight?.toString() || "",
                shippingLength: product.shippingLength?.toString() || "",
                shippingWidth: product.shippingWidth?.toString() || "",
                shippingHeight: product.shippingHeight?.toString() || "",
            });
            setMessage("");
            setNewImagePreviews([]);
        }
    }, [product, modalOpen]);

    // Preview new images
    useEffect(() => {
        if (input.newImages && input.newImages.length > 0) {
            const urls = input.newImages.map((file) => URL.createObjectURL(file));
            setNewImagePreviews(urls);
            return () => urls.forEach(url => URL.revokeObjectURL(url));
        } else {
            setNewImagePreviews([]);
        }
    }, [input.newImages]);

    const removeExistingImage = (index: number) => {
        const newExistingImages = input.existingImages.filter((_, i) => i !== index);
        setInput({ ...input, existingImages: newExistingImages });
    };

    const removeNewImage = (index: number) => {
        const newFiles = input.newImages.filter((_, i) => i !== index);
        setInput({ ...input, newImages: newFiles });
    };

    const handleSubmit = async () => {
        if (!product) return;

        setUploading(true);
        setMessage("");

        try {
            const formData = new FormData();
            
            // Add product ID and basic fields
            formData.append("productId", product.id);
            formData.append("name", input.name);
            formData.append("price", input.price);
            formData.append("vendorId", vendorId);
            formData.append("isDraft", input.isDraft.toString());
            formData.append("stockStatus", input.stockStatus);
            formData.append("quantityOptions", JSON.stringify(input.quantityOptions));
            formData.append("existingImages", JSON.stringify(input.existingImages));

            // Add optional fields
            if (input.shortDescription) formData.append("shortDescription", input.shortDescription);
            if (input.longDescription) formData.append("longDescription", input.longDescription);
            if (input.tags.length > 0) formData.append("tags", JSON.stringify(input.tags));
            if (input.catagories.length > 0) formData.append("categories", JSON.stringify(input.catagories));
            
            // Add discount fields
            if (input.originalPrice) formData.append("originalPrice", input.originalPrice);
            if (input.discountPercentage) formData.append("discountPercentage", input.discountPercentage);

            // Add shipping fields
            formData.append("shippingWeight", input.shippingWeight);
            formData.append("shippingLength", input.shippingLength);
            formData.append("shippingWidth", input.shippingWidth);
            formData.append("shippingHeight", input.shippingHeight);

            // Add new images
            input.newImages.forEach((file) => formData.append("images", file));

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
                method: "PUT",
                body: formData,
            });

            if (response.ok) {
                setMessage("Product updated successfully!");
                setTimeout(() => {
                    setModalOpen(false);
                    onProductUpdated();
                    setMessage("");
                }, 1500);
            } else {
                const errorData = await response.json();
                setMessage(`Error updating product: ${errorData.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error updating product:", error);
            setMessage("An unexpected error occurred");
        } finally {
            setUploading(false);
        }
    };

    if (!product) return null;

    return (
        <Modal open={modalOpen} setOpen={setModalOpen} className="w-[75%] h-[90%] rounded-xl flex flex-col justify-between">
            <div className="w-full h-full flex flex-col items-center overflow-y-auto gap-4">
                <div className="w-full flex flex-col h-auto items-center p-4">
                    <h2 className="text-xl font-bold mb-4">Edit Product: {product.name}</h2>
                    
                    <Input 
                        className="w-full" 
                        label="Name" 
                        value={input.name} 
                        onChange={(e) => setInput({ ...input, name: e.target.value })} 
                    />
                    
                    <Textarea 
                        label="Short Description" 
                        value={input.shortDescription} 
                        onChange={(e) => setInput({ ...input, shortDescription: e.target.value })} 
                    />
                    
                    <Textarea 
                        label="Long Description" 
                        value={input.longDescription} 
                        onChange={(e) => setInput({ ...input, longDescription: e.target.value })} 
                    />
                    
                    <Input 
                        label="Price" 
                        value={input.price} 
                        onChange={(e) => setInput({ ...input, price: e.target.value })} 
                    />
                    
                    <Input 
                        label="Original Price" 
                        value={input.originalPrice} 
                        onChange={(e) => setInput({ ...input, originalPrice: e.target.value })} 
                    />
                    
                    <Input 
                        label="Discount Percentage" 
                        value={input.discountPercentage} 
                        onChange={(e) => setInput({ ...input, discountPercentage: e.target.value })} 
                    />
                    
                    <Dropdown 
                        label="Stock Status" 
                        selected={stockStatusOptions.find(option => option.value === input.stockStatus) || stockStatusOptions[2]}
                        options={stockStatusOptions}
                        setSelected={(newSelected: string) => setInput({ ...input, stockStatus: newSelected as StockStatus })}
                    />
                    
                    <NumberTagInput 
                        label="Quantity Options" 
                        selectedNumbers={input.quantityOptions} 
                        onChange={(newQuantityOptions: number[]) => setInput({ ...input, quantityOptions: newQuantityOptions })} 
                        placeholder="Enter quantity (e.g., 1, 3, 6, 12)"
                    />

                    <h3 className="mt-4 mb-2 text-sm font-medium">Shipping Information (inches and pounds)</h3>
                    <Input 
                        label="Shipping Length" 
                        value={input.shippingLength} 
                        onChange={(e) => setInput({ ...input, shippingLength: e.target.value })} 
                    />
                    <Input 
                        label="Shipping Height" 
                        value={input.shippingHeight} 
                        onChange={(e) => setInput({ ...input, shippingHeight: e.target.value })} 
                    />
                    <Input 
                        label="Shipping Width" 
                        value={input.shippingWidth} 
                        onChange={(e) => setInput({ ...input, shippingWidth: e.target.value })} 
                    />
                    <Input 
                        label="Shipping Weight" 
                        value={input.shippingWeight} 
                        onChange={(e) => setInput({ ...input, shippingWeight: e.target.value })} 
                    />

                    <TagInput 
                        label="Tags" 
                        onChange={(newTags: string[]) => setInput({ ...input, tags: newTags })} 
                        selectedTags={input.tags} 
                    />
                    
                    <TagInput 
                        label="Categories" 
                        onChange={(newCategories: string[]) => setInput({ ...input, catagories: newCategories })} 
                        selectedTags={input.catagories} 
                    />

                    {/* Existing Images */}
                    <div className="w-full mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Images</label>
                        <div className="flex gap-2 flex-wrap">
                            {input.existingImages.map((url, i) => (
                                <div key={i} className="relative group">
                                    <img src={url} alt={`Current ${i + 1}`} className="h-20 w-20 object-cover rounded border" />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(i)}
                                        className="absolute top-0 right-0 bg-red-600 text-white rounded-full px-1 py-0.5 text-xs opacity-80 group-hover:opacity-100"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add New Images */}
                    <div className="w-full mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Add New Images</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setInput({ ...input, newImages: files });
                            }}
                            className="w-full"
                        />
                        
                        {/* New image previews */}
                        {newImagePreviews.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {newImagePreviews.map((url, i) => (
                                    <div key={i} className="relative group">
                                        <img src={url} alt={`New ${i + 1}`} className="h-20 w-20 object-cover rounded border" />
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(i)}
                                            className="absolute top-0 right-0 bg-red-600 text-white rounded-full px-1 py-0.5 text-xs opacity-80 group-hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <Checkbox 
                        className="!text-base my-4" 
                        label="Publish To Storefront?" 
                        bool={!input.isDraft} 
                        setBool={(newBool) => setInput({ ...input, isDraft: !newBool })} 
                    />
                </div>
                
                <div className="flex flex-row w-full justify-center gap-4 p-4">
                    <Button 
                        text={uploading ? "Updating..." : "Update Product"} 
                        onClick={handleSubmit} 
                        disabled={uploading} 
                    />
                    <Button 
                        text="Cancel" 
                        onClick={() => setModalOpen(false)} 
                    />
                </div>
                
                <div className="w-full h-4 flex items-center justify-center">
                    <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
}

// import { Product } from "@/app/types/types";
// import Modal from "../modal/Modal";
// import { useState } from "react";

// export default function StoreManagerUpdateProductModal({ product, modalOpen, setModalOpen }: { product: Product, modalOpen: boolean, setModalOpen: (newBool: boolean) => void }) {
//     return (
//         <Modal open={modalOpen} setOpen={setModalOpen} className="w-[75%] h-[90%] rounded-xl flex flex-col justify-between">
//             <div className="w-full h-full flex flex-col items-center overflow-y-auto gap-4">

//             </div>
//         </Modal>
//     )
// }