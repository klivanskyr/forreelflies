'use server';

import { Layout, Product, Sort } from "@/app/types/types";
import BasicCard from "../cards/BasicCard";
import Link from "next/link";
import AddToCartButton from "../buttons/AddToCartButton";
import ProductListButtons from "./ProductListButtons";

export default async function ProductList({ sort, pageSize, page, layout }: { sort: Sort, pageSize: number, page: number, layout: Layout }) {
    const fetchProducts = async () => {
        if (pageSize === -1) { // Get all products
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product?sort=${sort}`)
            if (!response.ok) {
                console.error("Error fetching products")
                return { data: [], meta: {} }
            }

            const json = await response.json()
            return { data: json.data, meta: json.meta }
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product?sort=${sort}&page=${page}&pageSize=${pageSize}`)
        if (!response.ok) {
            console.error("Error fetching products")
            return { data: [], meta: {} }
        }

        const data = await response.json()
        return { data: data.data, meta: data.meta }
    }

    const response = await fetchProducts();
    const products = response?.data || [];

    const divClassName = () => {
        switch (layout) {
            case "column":
                return "grid grid-cols-1 items-center justify-items-center m-2 max-w-[500px] gap-2"
            case "grid2":
                return "grid grid-cols-2 items-center justify-items-center m-2 gap-2"
            case "grid3":
                return "grid grid-cols-3 items-center justify-items-center m-2 gap-2"
            case "grid4":
                return "grid grid-cols-4 items-center justify-items-center m-2 gap-2"
        }
    }

    const cardClassName = () => {
        switch (layout) {
            case "column":
                return "!h-[75dvh]"
            case "grid2":
                return "!h-[80dvh]"
            case "grid3":
                return "!h-[62dvh]"
            case "grid4":
                return "!h-[50dvh]"
        }
    }

    return (
        <div className="mb-2">
            <div className={divClassName()}>
                {products.map((product: Product) => (
                        <BasicCard className={`w-full ${cardClassName()}`} key={product.id}>
                            <div className="h-full flex flex-col items-center w-full">
                                {product?.images && <Link className="w-full flex items-center justify-center overflow-hidden"href={`/product/${product.id}`}><img className="h-full object-contain" src={product.images[0]} alt={product.name} /></Link>}
                                <div className="flex flex-col w-full h-full justify-between items-center">
                                    <div className="flex flex-col items-center w-full my-2">
                                        <h1 className="font-bold mb-2">{product.name}</h1>
                                        {product.vendorName  && 
                                            <div className="flex flex-row gap-4 items-center align-center text-center text-xl">
                                                <p>Vendor:</p>
                                                <p>{product.vendorName}</p>
                                            </div>
                                        }
                                        <p>{product.shortDescription}</p>
                                        <p>${product.price}</p>
                                    </div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <Link href={`/product/${product.id}`}><button className="nocolorButton w-full border border-gray-100 text-black hover:bg-gray-100">View Item</button></Link>
                                        <AddToCartButton product={product} quantity={product.quantityOptions.reduce((acc, q) => q < acc ? q : acc)} /> {/* Opens login sidebar if not logged in.  */}
                                    </div>
                                </div>
                            </div>
                        </BasicCard>
                ))}
            </div>

            <ProductListButtons page={page} totalPages={response?.meta?.totalPages}/>
        </div>
    )
}