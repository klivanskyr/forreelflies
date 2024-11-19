'use client';

import { Product } from "@/app/types/types";
import Table from "../Table/Table";
import Button from "../buttons/Button";
import { useState } from "react";
import StoreManagerProductsModal from "./StoreManagerProductsModal";

export default function StoreManagerProductsTable({ vendorId, products }: { vendorId: string, products: Product[] }) {
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

    function EditButton({ item }: { item: Product }) {
        return (
            <>
                <div className="w-full flex flex-row justify-center"><Button className="w-1/2" text="Edit" onClick={() => setEditModalOpen(true)} /></div>
                <StoreManagerProductsModal input={item} modalOpen={editModalOpen} setModalOpen={setEditModalOpen} setInput={console.log} vendorId={vendorId} />
            </>
        )
    }

    return (
        <Table 
            columns={
                [
                    { label: <h2>Names</h2>, key: (item: Product) => <div className="flex flex-row w-full h-full items-center"><p>{item.name}</p></div>},
                    { label: <h2>Price</h2>, key: (item: Product) => <div className="flex flex-row w-full h-full items-center"><p>{`$${item.price?.toFixed(2) || "0.00"}`}</p></div>},
                    { label: <h2>Stock</h2>, key: (item: Product) => <div className="flex flex-row w-full h-full items-center"><p>{item.stockStatus || "Unknown"}</p></div>},
                    { label: <h2>Posted</h2>, key: (item: Product) => <div className="flex flex-row w-full h-full items-center"><p>{item.isDraft ? "Draft" : "Published"}</p></div>},
                    { label: <h2 className="text-center">Actions</h2>, key: (item: Product) => <EditButton item={item} />},
                ]
            }
            items={products}
            itemsPerPage={5}
        />
    )
}