'use client';

import { useState } from "react";
import Button from "../buttons/Button";
import Checkbox from "../Checkbox";
import Dropdown from "../inputs/Dropdown";
import Input from "../inputs/Input";
import TagInput from "../inputs/TagInput";
import Modal from "../modal/Modal";
import Textarea from "../Textarea";
import { Product, StockStatus } from "@/app/types/types";

export default function StoreManagerProductsModal({ vendorId, input, setInput, modalOpen, setModalOpen }: { vendorId: string, input: Product, setInput: (newInput: Product) => void, modalOpen: boolean, setModalOpen: (newBool: boolean) => void }) {
    const [message, setMessage] = useState<string>("");
    const [tempPriceInput, setTempPriceInput] = useState<string>(input.price?.toString() || "");
    
    const handleSubmit = async () => {
        const stripedPrice = tempPriceInput.replace(/[^0-9.]/g, "");
        const parsedPrice = parseFloat(stripedPrice);
        const formattedPrice = isNaN(parsedPrice) ? 0 : parsedPrice;
        const finalInput = { ...input, price: formattedPrice };
        
        if (!finalInput.name || !finalInput.price || !finalInput.isDraft) {
            setMessage("Error: Requires name, price, and 'Publish to Storefront?' ");
            setTimeout(() => {
                setMessage("");
            }, 2000);
            return;
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                vendorId: vendorId,
                ...finalInput
            })
        });

        if (response.ok) {
            setMessage("Product added successfully");
            setTimeout(() => {
                setModalOpen(false);
                setMessage("");
            }, 2000);
        } else {
            setMessage("Error adding product");
            setTimeout(() => {
                setMessage("");
            }, 2000);
        }
    }

    const stockStatusOptions = [
        { value: "inStock", label: "In Stock" },
        { value: "outOfStock", label: "Out of Stock" },
        { value: "unknown", label: "Unknown" }
    ]

    return (
        <Modal open={modalOpen} setOpen={setModalOpen} className="w-[75%] h-[90%] rounded-xl flex flex-col justify-between" >
            <div className="w-full h-full flex flex-col items-center overflow-y-auto gap-4">
                <div className="w-full flex flex-col h-full items-center p-4">
                    <Input className="w-full" label="Name" value={input.name} onChange={(e) => setInput({ ...input, name: e.target.value })} />
                    <Textarea label="Short Description" value={input.shortDescription} onChange={(e) => setInput({ ...input, shortDescription: e.target.value })} />
                    <Textarea label="Long Description" value={input.longDescription} onChange={(e) => setInput({ ...input, longDescription: e.target.value })} />
                    <Input label="Price" value={tempPriceInput} onChange={(e) => setTempPriceInput(e.target.value)} />
                    <Dropdown label="Stock Status" 
                        selected={ stockStatusOptions.find(option => option.value === input.stockStatus) || stockStatusOptions[2] }
                        options={[
                            { value: "inStock", label: "In Stock" },
                            { value: "outOfStock", label: "Out of Stock" },
                            { value: "unknown", label: "Unknown" }
                        ]} 
                        setSelected={(newSelected: string) => setInput({ ...input, stockStatus: newSelected as StockStatus })}
                    />
                    <TagInput label="Tags" onChange={(newTags: string[]) => setInput({ ...input, tags: newTags })} selectedTags={input.tags || []} />
                    <TagInput label="Categories" onChange={(newCategories: string[]) => setInput({ ...input, catagories: newCategories })} selectedTags={input.catagories || []} />
                    {/* <TagInput label="Upsells" onChange={(newUpsells: string[]) => setInput({ ...input, upsells: newUpsells })} selectedTags={input.upsells || []} />
                    <TagInput label="Cross Sells" onChange={(newCrossSells: string[]) => setInput({ ...input, crossSells: newCrossSells })} selectedTags={input.crossSells || []} /> */}
                    <Checkbox className="!text-base" label="Publish To Storefront?" bool={!input.isDraft || false} setBool={(newBool) => setInput({ ...input, isDraft: !newBool })} />
                </div>
                <div className="w-full h-12 flex items-center justify-center">
                    <h1>{message}</h1>
                </div>
                <div className="flex flex-row w-full justify-center gap-4">
                    <Button text="Save" onClick={() => handleSubmit()} />
                    <Button text="Close" onClick={() => setModalOpen(false)} />
                </div>
            </div>
        </Modal>
    )
}