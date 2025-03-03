'use client';

import { Product } from "@/app/types/types";
import { useState } from "react";
import { motion } from "framer-motion";
import { DiBlackberry } from "react-icons/di";

type Tab = "Description" | "Specifications" | "Reviews";
const tabs: Tab[] = ["Description", "Specifications", "Reviews"];

export default function ProductAdditionalInfo({ product }: { product: Product }) {
    const [activeTab, setActiveTab] = useState<Tab>("Description");

    return (
        <div className="flex flex-col w-full h-full items-center my-12">
            <div className="flex flex-row gap-4">
                {tabs.map((t, i) => (
                    <button 
                        key={i}
                        className={`relative text-lg transition-all ${t === activeTab ? "text-black" : "text-gray-600"}`}
                        onClick={() => setActiveTab(t)}
                    >
                        {t}
                        {t === activeTab ? (
                            <motion.div 
                                style={{ 
                                    position: "absolute",
                                    bottom: -2,
                                    left: 0,
                                    right: 0,
                                    height: 2,
                                    background: "#000",
                                }}
                                layoutId="underline"
                                id="underline"
                            />
                        ) : <></>}
                    </button>
                ))}
            </div>
            <div className="m-4">
                {activeTab === "Description" && (
                    <div className="flex flex-col w-full h-full p-4 gap-3">
                        <p>{product.longDescription}</p>
                    </div>
                )}
                {activeTab === "Specifications" && (
                    <div className="flex flex-col w-full h-full p-4 gap-3">
                        <h2>Id: {product.id}</h2>
                        <h2>Vendor: {product.vendorName}</h2>
                        <h2>Vendor Id: {product.vendorId}</h2>
                        <h2>Unit Price: ${product.price}</h2>
                        <h2>Stock Status: {product.stockStatus}</h2>
                        <h2>Shipping Weight: {product.shippingWeight}</h2>
                        <h2>Shipping Length: {product.shippingLength}</h2>
                        <h2>Shipping Width: {product.shippingWidth}</h2>
                        <h2>Shipping Height: {product.shippingHeight}</h2>
                        <h2>Processing Time: {product.processingTime}</h2>
                        <h2>Quantity Options: {product.quantityOptions}</h2>
                        <h2>Tags: {product.tags}</h2>
                        <h2>Categories: {product.catagories}</h2>
                        {/* <h2>Upsells: Coming Soon!</h2>
                        <h2>Cross Sells: Coming Soon!</h2> */}
                    </div>
                )}
                {activeTab === "Reviews" && (
                    <div className="flex flex-col w-full h-full p-4 gap-3">
                        <h2 className="font-semibold text-2xl">Reviews</h2>
                        <p>Reviews coming soon!</p>
                    </div>
                )}
            </div>
        </div>
    )
}