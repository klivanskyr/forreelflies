'use client';

import { useState } from "react";
import Button from "./buttons/Button";
import { Product } from "@/app/types/types";
import StoreManagerProductModal, { ProductInput } from "./storeManagerHelpers/StoreManagerProductModal";

export default function StoreManagerProductsHeader({ vendorId }: { vendorId: string }) {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [message, setMessage] = useState<string>("");
    const [input, setInput] = useState<ProductInput>({
        name: "",
        shortDescription: "",
        longDescription: "",
        isDraft: true,
        stockStatus: "unknown",
        price: "",
        shippingHeight: "",
        shippingLength: "",
        shippingWeight: "",
        shippingWidth: "",
        tags: [],
        catagories: [],
        images: [],
        quantityOptions: []
    });

    const stringtofloat = (str: string) => {
        const stripedString = str.replace(/[^0-9.]/g, "");
        const parsedFloat = parseFloat(stripedString);
        return isNaN(parsedFloat) ? 0 : parsedFloat;
    }
    
    const handleSubmit = async () => {
        try {
            const price = stringtofloat(input.price);
            const shippingHeight = stringtofloat(input.shippingHeight);
            const shippingLength = stringtofloat(input.shippingLength);
            const shippingWeight = stringtofloat(input.shippingWeight);
            const shippingWidth = stringtofloat(input.shippingWidth);

            // Validate required fields
            if (!input.name || price <= 0 || input.isDraft === undefined || shippingHeight <= 0 || shippingLength <= 0 || shippingWeight <= 0 || shippingWidth <= 0) {
                setMessage("Please fill in all required fields");
                setTimeout(() => {
                    setMessage("");
                }, 10000);
                return;
            }

            // Convert quanityOptions to number array
            const quantityOptions = input.quantityOptions.map(option => parseInt(option)).filter(option => !isNaN(option)).sort();

    
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
    
            // Append images to FormData
            input.images.forEach((file) => formData.append("images", file));
            
            console.log("Form Data:", formData);
            // Send FormData to backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
                method: "POST",
                body: formData,
            });
    
            if (response.ok) {
                setMessage("Product added successfully");
                setTimeout(() => {
                    setModalOpen(false);
                    setMessage("");
                }, 1000);
            } else {
                const errorData = await response.json();
                setMessage(`Error adding product: ${errorData.error || "Unknown error"}`);
                setTimeout(() => {
                    setMessage("");
                }, 10000);
            }
        } catch (error) {
            console.error("Error submitting product:", error);
            setMessage("An unexpected error occurred");
            setTimeout(() => {
                setMessage("");
            }, 10000);
        }
    };

    return (
        <div className="flex flex-row w-full justify-between py-2 pr-4 pl-2">
            <h1 className="text-2xl font-semibold">Products</h1>
            <Button text="Add Product" onClick={() => { setModalOpen(true); setInput({ name: "", shortDescription: "", longDescription: "", isDraft: false, price: "", stockStatus: "unknown", tags: [], catagories: [], images: [], quantityOptions: [], shippingHeight: "", shippingLength: "", shippingWeight: "", shippingWidth: "" }) }} />
            <StoreManagerProductModal handleSubmit={handleSubmit} errorMessage={message} input={input} modalOpen={modalOpen} setModalOpen={setModalOpen} setInput={setInput} vendorId={vendorId} />
        </div>
    )
}