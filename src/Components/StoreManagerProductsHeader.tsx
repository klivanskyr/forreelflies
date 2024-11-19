'use client';

import { useState } from "react";
import Button from "./buttons/Button";
import { Product } from "@/app/types/types";
import StoreManagerProductsModal from "./storeManagerHelpers/StoreManagerProductsModal";

export default function StoreManagerProductsHeader({ vendorId }: { vendorId: string }) {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [input, setInput] = useState<Product>({
        // id: "",
        // vendorId: "",
        // processingTime: 0,
        // shippingHeight: 0,
        // shippingLength: 0,
        // shippingWeight: 0,
        // shippingWidth: 0,
        name: "",
        shortDescription: "",
        longDescription: "",
        isDraft: true,
        stockStatus: "unknown",
        price: undefined,
        tags: [],
        catagories: [],
        upsells: [],
        crossSells: [],
    });

    return (
        <div className="flex flex-row w-full justify-between py-2 pr-4 pl-2">
            <h1 className="text-2xl font-semibold">Products</h1>
            <Button text="Add Product" onClick={() => { setModalOpen(true); setInput({ name: "", shortDescription: "", longDescription: "", isDraft: false, price: 0, stockStatus: "unknown", tags: [], catagories: [], upsells: [], crossSells: [] }) }} />
            <StoreManagerProductsModal input={input} modalOpen={modalOpen} setModalOpen={setModalOpen} setInput={setInput} vendorId={vendorId} />
        </div>
    )
}