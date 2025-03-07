'use server';

import { Product } from "@/app/types/types"
import { ProductAdditionalInfo, ProductInfo } from "@/Components/ProductInfo"

export default async function Page({ params }: { params: Promise<{ productId: string }>}) {
    const productId = (await params).productId
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product?id=${productId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
    const data = await response.json()
    const product = data.data as Product

    const { tokenToUser } = await import("@/lib/firebase-admin");
    const user = await tokenToUser(); //propdrilling bad

    return (
        <div className="flex flex-col w-full h-full items-center gap-4">
            <div className="flex flex-row w-full h-full">
                <div className="w-full h-full p-8">
                    {product.images && <img src={product.images[0]} alt={product.name} className="object-cover" />}
                </div>
                <div className="w-full h-full p-8">
                    <ProductInfo user={user} product={product} />
                </div>
            </div>
            <div className="h-[1px] bg-black w-[80%]" />
            <div>
                <ProductAdditionalInfo product={product} />
            </div>
        </div>
    )
}