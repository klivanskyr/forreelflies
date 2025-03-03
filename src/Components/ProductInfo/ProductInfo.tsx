'use client';

import { Product } from "@/app/types/types";
import { useState } from "react";
import { IoHeartCircleOutline } from "react-icons/io5";
import Dropdown from "../inputs/Dropdown";
import AddToCartButton from "../buttons/AddToCartButton";
import { DbUser } from "@/lib/firebase-admin";

export default function ProductInfo({ user, product }: { user: DbUser | null, product: Product }) {
    const dropdownQuantityOptions = product.quantityOptions.map((option) => {
        return {
            value: option.toString(),
            label: option.toString(),
        }
    }).sort((a, b) => (parseInt(a.value) > parseInt(b.value) ? 1 : -1));

    const [selectedQuantity, setSelectedQuantity] = useState(dropdownQuantityOptions[0].value)

    return (
        <div className="flex flex-col w-full h-full p-4 gap-3">
            <h1 className="font-semibold text-3xl">{product.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h1>
            <div className="flex flex-col gap-2 border border-gray-300 px-4 py-2 rounded-sm w-fit ">
                <h2 className="text-md">Vendor: </h2>
                <div className="flex flex-row gap-2 items-center text-xl">
                    <div>logo</div>
                    <h2 className="">{product.vendorName}</h2>
                </div>
                <div>rating</div>
            </div>
            <p className="mb-12">{product.longDescription}</p>
            <h2 className="text-2xl text-gray-700">${product.price}</h2>
            <div className="w-[100%]">
                <Dropdown
                    label="Quantity" 
                    options={dropdownQuantityOptions}
                    selected={dropdownQuantityOptions.find(option => option.value === selectedQuantity) || dropdownQuantityOptions[0]}
                    setSelected={(newSelected) => setSelectedQuantity(newSelected)}
                />
            </div>
            <AddToCartButton user={user} product={product} quantity={parseInt(selectedQuantity)} />
            <button className="w-fit">
                <div className="flex flex-row gap-2 items-center hover:text-gray-500 transition-all w-fit">
                    <IoHeartCircleOutline className="h-6 w-6" />
                    <h2>Wishlist</h2>
                </div>
            </button>
        </div>
    )
}