'use client';

import { Product } from "@/app/types/types";
import Table from "../Table/Table";
import Button from "../buttons/Button";
import { useState } from "react";

export default function StoreManagerProductsTable({ products }: { products: Product[] }) {
    const [_, setEditModalOpen] = useState<boolean>(false);

    function EditButton() {
        return (
            <>
                <div className="w-full flex flex-row justify-center"><Button className="w-1/2" text="Edit" onClick={() => setEditModalOpen(true)} /></div>
            </>
        )
    }

    console.log("Products", products);

    const options = [
        { value: "inStock", label: "In Stock" },
        { value: "outOfStock", label: "Out of Stock" },
        { value: "unknown", label: "Unknown" }
    ];

    const convertStockStatus = (stockStatus: string | undefined) => {
        return options.find(option => option.value === stockStatus)?.label || "Unknown";
    }

    return (
        <Table 
            columns={
                [
                    { label: <h2>Names</h2>, key: (item: Product) => <div className="flex flex-row w-full h-full items-center"><p>{item.name}</p></div>},
                    { label: <h2>Price</h2>, key: (item: Product) => <div className="flex flex-row w-full h-full items-center"><p>{`$${item.price?.toFixed(2) || "0.00"}`}</p></div>},
                    { label: <h2>Stock</h2>, key: (item: Product) => <div className="flex flex-row w-full h-full items-center"><p>{convertStockStatus(item.stockStatus)}</p></div>},
                    { label: <h2>Posted</h2>, key: (item: Product) => <div className="flex flex-row w-full h-full items-center"><p>{item.isDraft ? "Draft" : "Published"}</p></div>},
                    { label: <h2 className="text-center">Actions</h2>, key: (_) => <EditButton />},
                ]
            }
            items={products}
            itemsPerPage={5}
        />
    )
}