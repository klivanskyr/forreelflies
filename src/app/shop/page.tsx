import ProductList from "@/components/shop/ProductList";
import { Layout, PageSize, Sort } from "../types/types";
import ShopHeader from "@/components/shop/ShopHeader"; 

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }>}) {
    const params = await searchParams;
    const sort = params.sort as Sort || "latest";
    const pageSize = parseInt(params.pageSize as string) as PageSize || "10";
    const page = parseInt(params.page as string) || 1;
    const layout = params.layout as Layout || "grid3";

    return (
        <div className="flex flex-col w-full h-full items-center">
            <ShopHeader sort={sort} pageSize={pageSize} />
            <ProductList sort={sort} pageSize={pageSize} page={page} layout={layout} />
        </div>
    )
}