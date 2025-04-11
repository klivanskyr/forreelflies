'use client';

import { PageSize, Sort } from "@/app/types/types";
import Dropdown from "../inputs/Dropdown";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { addKVToUrl } from "@/helpers/addKVToUrl";
import { Suspense } from "react";

export default function ShopHeader({ sort, pageSize }: { sort: Sort, pageSize: PageSize }) {
    const router = useRouter();
    const currentUrl = usePathname();
    const currentSearchParams = useSearchParams();

    const sortOptions = [
        { label: "Latest", value: "latest" },
        { label: "Oldest", value: "oldest" },
        { label: "Price: Low to High", value: "priceLowToHigh" },
        { label: "Price: High to Low", value: "priceHighToLow" }
    ]

    const pageSizeOptions = [
        { label: "5", value: "5" },
        { label: "10", value: "10" },
        { label: "20", value: "20" },
        { label: "50", value: "50" },
        { label: "100", value: "100" },
        { label: "All", value: "-1" } // -1 returns all 
    ]

    const setSort = async (newSort: Sort) => {
        const newUrl = addKVToUrl(currentUrl, currentSearchParams, "sort", newSort);
        router.push(newUrl);
    }

    const setPageSize = async (newPageSize: PageSize) => {
        const newUrl = addKVToUrl(currentUrl, currentSearchParams, "pageSize", newPageSize.toString());
        router.push(newUrl);
    }

    return (
        <Suspense fallback={<div className="flex flex-row w-full justify-between px-2 pt-2"><h1>Loading...</h1></div>}>
            <div className="flex flex-row w-full justify-between px-2 pt-2">
                <div className="flex flex-row gap-4 items-center">
                    <Dropdown
                        classNames={{ select: "text-lg mr-36" }}
                        options={sortOptions}
                        selected={sortOptions.find(option => option.value === sort) || sortOptions[0]}
                        setSelected={(newSelected: string) => setSort(newSelected as Sort)}
                    />
                    {/* <Filters /> */}
                </div>
                <div className="flex flex-row items-center gap-4">
                    <h2>Show</h2>
                    <Dropdown 
                        classNames={{ select: "text-lg mr-2" }}
                        options={pageSizeOptions}
                        selected={pageSizeOptions.find(option => option.value === pageSize.toString()) || pageSizeOptions[0]}
                        setSelected={(newSelected: string) => setPageSize(parseInt(newSelected) as PageSize)}
                    />
                </div>
            </div>
        </Suspense>
    )
}