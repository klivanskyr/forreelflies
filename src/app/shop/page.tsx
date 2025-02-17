"use client";

import Dropdown from "@/Components/inputs/Dropdown";
import ProductList from "@/Components/lists/ProductList";
import { useState } from "react";
import { Sort } from "../types/types";

export default function Page() {
    const [sort, setSort] = useState<Sort>("latest");
    const [pageSize, setPageSize] = useState<number>(5);
    // const [filter, setFilter] = useState<string>("");

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

    return (
        <div className="flex flex-col w-full h-full items-center">
            <div className="flex flex-row w-full justify-between px-2 pt-2 overflow-clip">
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
                        setSelected={(newSelected: string) => setPageSize(parseInt(newSelected))}
                    />
                </div>
            </div>
            <ProductList sort={sort} pageSize={pageSize} />
        </div>
    )
}