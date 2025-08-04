'use client';

import { useState, Dispatch, SetStateAction } from "react";
import Button from "./buttons/Button";
import StoreManagerProductModal, { ProductInput } from "./storeManagerHelpers/StoreManagerProductModal";
import { toast } from "sonner";
import { FaPlus } from "react-icons/fa";

interface Props {
    vendorId: string;
    onProductAdded?: () => void;
    modalOpen?: boolean;
    setModalOpen?: Dispatch<SetStateAction<boolean>>;
    tourStep?: number;
    onDraftCreated?: (draftId: string) => void;
}

export default function StoreManagerProductsHeader({
    vendorId,
    onProductAdded,
    modalOpen: controlledModalOpen,
    setModalOpen: controlledSetModalOpen,
    tourStep,
    onDraftCreated
}: Props) {
    // If controlled props are provided, use them; otherwise, use internal state
    const [uncontrolledModalOpen, setUncontrolledModalOpen] = useState<boolean>(false);
    const modalOpen = controlledModalOpen !== undefined ? controlledModalOpen : uncontrolledModalOpen;
    const setModalOpen = controlledSetModalOpen || setUncontrolledModalOpen;
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

    const handleSubmit = async (imageUrls: string[]) => {
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
                
                // Notify parent of draft creation if callback provided
                if (input.isDraft && onDraftCreated && responseData.id) {
                    onDraftCreated(responseData.id);
                }

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
                
                // Only close modal if not in tour mode
                if (tourStep === undefined) {
                    setTimeout(() => {
                        setModalOpen(false);
                        onProductAdded?.();
                    }, 1000);
                }
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

    // Use controlled modal state when in tour mode
    const internalModalOpen = controlledModalOpen ?? uncontrolledModalOpen;
    const setInternalModalOpen = controlledSetModalOpen ?? setUncontrolledModalOpen;

    return (
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-bold text-greenPrimary">Products</h1>
            <Button
                text="Add Product"
                onClick={() => setModalOpen(true)}
                color="green"
                data-tour="add-product-btn"
                // Hide button during tour steps 1+ (when modal should be open)
                style={{ 
                    visibility: tourStep !== undefined && tourStep >= 1 ? 'hidden' : 'visible' 
                }}
            />
            <StoreManagerProductModal
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                input={input}
                setInput={setInput}
                modalOpen={modalOpen}
                setModalOpen={setModalOpen}
                vendorId={vendorId}
                tourStep={tourStep}
            />
        </div>
    );
}