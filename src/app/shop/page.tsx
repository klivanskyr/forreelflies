import ProductList from "@/components/shop/ProductList";
import { Layout, PageSize, Sort } from "../types/types";
import ShopHeader from "@/components/shop/ShopHeader"; 

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }>}) {
    const params = await searchParams;
    const sort = params.sort as Sort || "latest";
    const pageSize = parseInt(params.pageSize as string) as PageSize || 12;
    const page = parseInt(params.page as string) || 1;
    const layout = params.layout as Layout || "grid3";
    const search = params.search as string || "";
    const category = params.category as string || "";
    const tag = params.tag as string || "";

    return (
        <div className="flex flex-col w-full min-h-screen bg-gray-50">
            <div className="max-w-[100vw] mx-0 flex flex-col gap-4 w-full justify-center items-center">
                <ShopHeader sort={sort} pageSize={pageSize} layout={layout} />
                <div className="flex-1">
                    <ProductList 
                        sort={sort} 
                        pageSize={pageSize} 
                        page={page} 
                        layout={layout}
                        search={search || undefined}
                        category={category || undefined}
                        tag={tag || undefined}
                    />
                </div>
            </div>
        </div>
    )
}