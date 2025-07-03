'use client';

import { useState } from "react";
import Button from "./buttons/Button";
import StoreManagerProductModal, { ProductInput } from "./storeManagerHelpers/StoreManagerProductModal";
import toast from "react-hot-toast";

export default function StoreManagerProductsHeader({ vendorId, onProductAdded }: { vendorId: string; onProductAdded?: () => void }) {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [input, setInput] = useState<ProductInput>({
        name: "",
        shortDescription: "",
        longDescription: "",
        isDraft: true,
        stockStatus: "unknown",
        price: "",
        originalPrice: "",
        discountPercentage: "",
        stockQuantity: "",
        lowStockThreshold: "",
        trackQuantity: false,
        shippingHeight: "",
        shippingLength: "",
        shippingWeight: "",
        shippingWidth: "",
        tags: [],
        catagories: [],
        images: [],
        quantityOptions: [],
    });

    const stringtofloat = (str: string) => {
        const stripedString = str.replace(/[^0-9.]/g, "");
        const parsedFloat = parseFloat(stripedString);
        return isNaN(parsedFloat) ? 0 : parsedFloat;
    }

    const validateProductData = () => {
        const price = stringtofloat(input.price);
        const shippingHeight = stringtofloat(input.shippingHeight);
        const shippingLength = stringtofloat(input.shippingLength);
        const shippingWeight = stringtofloat(input.shippingWeight);
        const shippingWidth = stringtofloat(input.shippingWidth);

        // Check required fields
        if (!input.name.trim()) {
            toast.error("Product name is required");
            return false;
        }

        if (input.name.length < 3) {
            toast.error("Product name must be at least 3 characters long");
            return false;
        }

        if (price <= 0) {
            toast.error("Product price must be greater than $0");
            return false;
        }

        if (price > 10000) {
            toast.error("Product price cannot exceed $10,000");
            return false;
        }

        // Validate shipping dimensions
        if (shippingHeight <= 0) {
            toast.error("Shipping height must be greater than 0 inches");
            return false;
        }

        if (shippingLength <= 0) {
            toast.error("Shipping length must be greater than 0 inches");
            return false;
        }

        if (shippingWeight <= 0) {
            toast.error("Shipping weight must be greater than 0 pounds");
            return false;
        }

        if (shippingWidth <= 0) {
            toast.error("Shipping width must be greater than 0 inches");
            return false;
        }

        // Validate reasonable shipping dimensions
        if (shippingHeight > 100 || shippingLength > 100 || shippingWidth > 100) {
            toast.error("Shipping dimensions cannot exceed 100 inches");
            return false;
        }

        if (shippingWeight > 150) {
            toast.error("Shipping weight cannot exceed 150 pounds");
            return false;
        }

        // Validate quantity options
        if (input.quantityOptions.length === 0) {
            toast.error("At least one quantity option is required (e.g., 1, 3, 6, 12)");
            return false;
        }

        // Validate discount if provided
        if (input.originalPrice) {
            const originalPrice = stringtofloat(input.originalPrice);
            if (originalPrice <= price) {
                toast.error("Original price must be higher than current price for discounts");
                return false;
            }
        }

        // Validate stock quantity if tracking is enabled
        if (input.trackQuantity) {
            const stockQuantity = parseInt(input.stockQuantity);
            if (isNaN(stockQuantity) || stockQuantity < 0) {
                toast.error("Stock quantity must be a valid number (0 or greater)");
                return false;
            }

            if (input.lowStockThreshold) {
                const threshold = parseInt(input.lowStockThreshold);
                if (isNaN(threshold) || threshold < 0) {
                    toast.error("Low stock threshold must be a valid number (0 or greater)");
                    return false;
                }
                if (threshold > stockQuantity) {
                    toast.error("Low stock threshold cannot be higher than current stock quantity");
                    return false;
                }
            }
        }

        return true;
    };
    
    const handleSubmit = async (imageUrls: string[]) => {
        if (!validateProductData()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const price = stringtofloat(input.price);
            const shippingHeight = stringtofloat(input.shippingHeight);
            const shippingLength = stringtofloat(input.shippingLength);
            const shippingWeight = stringtofloat(input.shippingWeight);
            const shippingWidth = stringtofloat(input.shippingWidth);

            // quantityOptions is already a number array
            const quantityOptions = input.quantityOptions.sort((a, b) => a - b);

            // Create FormData object
            const formData = new FormData();
            formData.append("name", input.name);
            formData.append("shortDescription", input.shortDescription);
            formData.append("longDescription", input.longDescription);
            formData.append("price", price.toString());
            formData.append("shippingHeight", shippingHeight.toString());
            formData.append("shippingLength", shippingLength.toString());
            formData.append("shippingWeight", shippingWeight.toString());
            formData.append("shippingWidth", shippingWidth.toString());
            formData.append("vendorId", vendorId);
            formData.append("stockStatus", input.stockStatus);
            formData.append("isDraft", input.isDraft.toString());
            formData.append("tags", JSON.stringify(input.tags));
            formData.append("categories", JSON.stringify(input.catagories));
            formData.append("quantityOptions", JSON.stringify(quantityOptions));
            
            // Add discount fields
            if (input.originalPrice) formData.append("originalPrice", input.originalPrice);
            if (input.discountPercentage) formData.append("discountPercentage", input.discountPercentage);
            if (input.stockQuantity) formData.append("stockQuantity", input.stockQuantity);
            if (input.lowStockThreshold) formData.append("lowStockThreshold", input.lowStockThreshold);
            formData.append("trackQuantity", input.trackQuantity.toString());
            
            // Append image URLs
            formData.append("imageUrls", JSON.stringify(imageUrls));
            
            console.log("Creating product with data:", {
                name: input.name,
                price: price,
                vendorId: vendorId,
                imageCount: imageUrls.length
            });

            // Send FormData to backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
                method: "POST",
                body: formData,
            });
    
            if (response.ok) {
                const responseData = await response.json();
                console.log("Product created successfully:", responseData);
                
                toast.success(`Product "${input.name}" ${input.isDraft ? 'saved as draft' : 'created'} successfully!`);
                
                // Reset form
                setInput({ 
                    name: "", 
                    shortDescription: "", 
                    longDescription: "", 
                    isDraft: false, 
                    price: "", 
                    stockStatus: "unknown", 
                    tags: [], 
                    catagories: [], 
                    images: [], 
                    quantityOptions: [], 
                    shippingHeight: "", 
                    shippingLength: "", 
                    shippingWeight: "", 
                    shippingWidth: "", 
                    originalPrice: "", 
                    discountPercentage: "", 
                    stockQuantity: "", 
                    lowStockThreshold: "", 
                    trackQuantity: false 
                });
                
                // Close modal and refresh list
                setTimeout(() => {
                    setModalOpen(false);
                    onProductAdded?.(); // Refresh the products list
                }, 1000);
            } else {
                const errorData = await response.json();
                console.error("Product creation failed:", errorData);
                
                if (response.status === 400) {
                    toast.error(`Invalid product data: ${errorData.error || "Please check all fields"}`);
                } else if (response.status === 401) {
                    toast.error("Authentication failed. Please log in and try again.");
                } else if (response.status === 403) {
                    toast.error("You don't have permission to create products. Please verify your vendor status.");
                } else if (response.status >= 500) {
                    toast.error("Server error. Please try again in a few minutes.");
                } else {
                    toast.error(`Error creating product: ${errorData.error || "Unknown error"}`);
                }
            }
        } catch (networkError) {
            console.error("Network error creating product:", networkError);
            
            if (networkError instanceof TypeError && networkError.message.includes("fetch")) {
                toast.error("Connection error. Please check your internet connection and try again.");
            } else {
                toast.error("Failed to create product. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenModal = () => {
        setModalOpen(true);
        setInput({ 
            name: "", 
            shortDescription: "", 
            longDescription: "", 
            isDraft: false, 
            price: "", 
            stockStatus: "unknown", 
            tags: [], 
            catagories: [], 
            images: [], 
            quantityOptions: [], 
            shippingHeight: "", 
            shippingLength: "", 
            shippingWeight: "", 
            shippingWidth: "", 
            originalPrice: "", 
            discountPercentage: "", 
            stockQuantity: "", 
            lowStockThreshold: "", 
            trackQuantity: false 
        });
    };

    return (
        <div className="flex flex-row w-full justify-between py-2 pr-4 pl-2">
            <h1 className="text-2xl font-semibold">Products</h1>
            <Button 
                text="Add Product" 
                onClick={handleOpenModal}
                disabled={isSubmitting}
            />
            <StoreManagerProductModal 
                handleSubmit={handleSubmit} 
                isSubmitting={isSubmitting}
                input={input} 
                modalOpen={modalOpen} 
                setModalOpen={setModalOpen} 
                setInput={setInput} 
                vendorId={vendorId} 
            />
        </div>
    )
}