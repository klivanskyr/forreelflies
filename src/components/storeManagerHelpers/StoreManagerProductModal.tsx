'use client';

import React, { useState } from "react";
import Button from "../buttons/Button";
import Checkbox from "../Checkbox";
import Dropdown from "../inputs/Dropdown";
import Input from "../inputs/Input";
import TagInput from "../inputs/TagInput";
import Modal from "../modal/Modal";
import Textarea from "../Textarea";
import { StockStatus } from "@/app/types/types";
import { uploadFileAndGetUrl } from "@/lib/firebase";

export interface ProductInput {
    name: string;
    shortDescription: string;
    longDescription: string;
    price: string;
    stockStatus: string;
    quantityOptions: string[];
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
    handleSubmit: (imageUrls?: string[]) => object,
    errorMessage: string,
    vendorId: string,
    input: T,
    setInput: (newInput: T) => void,
    modalOpen: boolean,
    setModalOpen: (newBool: boolean) => void
}

export default function StoreManagerProductModal({ handleSubmit, errorMessage, input, setInput, modalOpen, setModalOpen }: Props<ProductInput>) {    
    const stockStatusOptions = [
        { value: "inStock", label: "In Stock" },
        { value: "outOfStock", label: "Out of Stock" },
        { value: "unknown", label: "Unknown" }
    ]
    const [uploading, setUploading] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    // Preview selected images
    React.useEffect(() => {
        if (input.images && input.images.length > 0) {
            const urls = input.images.map((file) => URL.createObjectURL(file));
            setImagePreviews(urls);
        } else {
            setImagePreviews([]);
        }
    }, [input.images]);

    // Remove image
    const removeImage = (idx: number) => {
        const newFiles = input.images.filter((_, i) => i !== idx);
        setInput({ ...input, images: newFiles });
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

    return (
        <Modal open={modalOpen} setOpen={setModalOpen} className="w-[75%] h-[90%] rounded-xl flex flex-col justify-between" >
            <div className="w-full h-full flex flex-col items-center overflow-y-auto gap-4">
                <div className="w-full flex flex-col h-auto items-center p-4">
                    <Input className="w-full" label="Name" value={input.name} onChange={(e) => setInput({ ...input, name: e.target.value })} />
                    <Textarea label="Short Description" value={input.shortDescription} onChange={(e) => setInput({ ...input, shortDescription: e.target.value })} />
                    <Textarea label="Long Description" value={input.longDescription} onChange={(e) => setInput({ ...input, longDescription: e.target.value })} />
                    <Input label="Price" value={input.price} onChange={(e) => setInput({ ...input, price: e.target.value })} />
                    <Dropdown label="Stock Status" 
                        selected={stockStatusOptions.find(option => option.value === input.stockStatus) || stockStatusOptions[2] }
                        options={stockStatusOptions}
                        setSelected={(newSelected: string) => setInput({ ...input, stockStatus: newSelected as StockStatus })}
                    />
                    <Input label="Quantity Options" value={input.quantityOptions.join(",")} onChange={(e) => setInput({ ...input, quantityOptions: e.target.value.split(",") })} />

                    <h1 className="mt-4 mb-2 text-sm">Shipping Fields. Do not input units. Inches and pounds are assumed.</h1>
                    <Input label="Shipping Length" value={input.shippingLength} onChange={(e) => setInput({ ...input, shippingLength: e.target.value })} />
                    <Input label="Shipping Height" value={input.shippingHeight} onChange={(e) => setInput({ ...input, shippingHeight: e.target.value })} />
                    <Input label="Shipping Width" value={input.shippingWidth} onChange={(e) => setInput({ ...input, shippingWidth: e.target.value })} />
                    <Input label="Shipping Weight" value={input.shippingWeight} onChange={(e) => setInput({ ...input, shippingWeight: e.target.value })} />
                    

                    {/* Tags and Categories */}
                    <TagInput label="Tags" onChange={(newTags: string[]) => setInput({ ...input, tags: newTags })} selectedTags={input.tags || []} />
                    <TagInput label="Categories" onChange={(newCategories: string[]) => setInput({ ...input, catagories: newCategories })} selectedTags={input.catagories || []} />
                    {/* <TagInput label="Upsells" onChange={(newUpsells: string[]) => setInput({ ...input, upsells: newUpsells })} selectedTags={input.upsells || []} />
                    <TagInput label="Cross Sells" onChange={(newCrossSells: string[]) => setInput({ ...input, crossSells: newCrossSells })} selectedTags={input.crossSells || []} /> */}

                    {/* Image Upload */}
                    <label className="block text-sm font-medium text-gray-700">Images</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setInput({ ...input, images: files });
                        }}
                    />
                    {/* Image previews */}
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {imagePreviews.map((url, i) => (
                            <div key={i} className="relative group">
                                <img src={url} alt={`Preview ${i + 1}`} className="h-20 w-20 object-cover rounded border" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full px-1 py-0.5 text-xs opacity-80 group-hover:opacity-100"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <Checkbox className="!text-base my-1" label="Publish To Storefront?" bool={input.isDraft} setBool={(newBool) => setInput({ ...input, isDraft: newBool })} />
                </div>
                <div className="flex flex-row w-full justify-center gap-4">
                    <Button text={uploading ? "Uploading..." : "Save"} onClick={handleSave} disabled={uploading} />
                    <Button text="Close" onClick={() => setModalOpen(false)} />
                </div>
                <div className="w-full h-4 flex items-center justify-center">
                    <h1>{errorMessage}</h1>
                </div>
            </div>
        </Modal>
    )
}