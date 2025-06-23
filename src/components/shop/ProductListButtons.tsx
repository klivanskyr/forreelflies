'use client';

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addKVToUrl } from "@/helpers/addKVToUrl";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Input from "../inputs/Input";
import { Suspense, useState } from "react";

export default function ProductListButtons({ page, totalPages }: { page: number, totalPages: number }) {
    const router = useRouter();
    const currentUrl = usePathname();
    const currentSearchParams = useSearchParams();
    const [input, setInput] = useState<string>(page.toString());

    const changePage = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;

        const newUrl = addKVToUrl(currentUrl, currentSearchParams, "page", newPage.toString());
        router.push(newUrl);
    }

    const isNoPages = totalPages === 0;
    
    // Don't render pagination if there are no pages
    if (isNoPages) {
        return null;
    }

    return (
        <Suspense fallback={<div className="flex justify-center items-center gap-1"><h1>Loading...</h1></div>}>
            <div className="flex justify-center items-center gap-4 py-4">
                <button
                    onClick={() => changePage(page - 1)}
                    disabled={page - 1 < 1}
                    className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 disabled:hover:bg-transparent transition-colors disabled:cursor-not-allowed"
                >
                    <FaChevronLeft className={`w-[20px] h-[20px] ${page - 1 < 1 ? "text-gray-400" : "text-gray-700 hover:text-gray-900"}`} />
                </button>
                
                <div className="flex flex-row items-center gap-2">
                    <span className="text-sm text-gray-600">Page</span>
                    <form onSubmit={(e) => { e.preventDefault(); changePage(parseInt(input))}} >
                        <Input 
                            className="!w-[60px] !h-[32px] !p-2 text-center text-sm" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                        />
                    </form>
                    <span className="text-sm text-gray-600">of {totalPages}</span>
                </div>
                
                <button
                    onClick={() => changePage(page + 1)}
                    disabled={page + 1 > totalPages}
                    className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 disabled:hover:bg-transparent transition-colors disabled:cursor-not-allowed"
                >
                    <FaChevronRight className={`w-[20px] h-[20px] ${page + 1 > totalPages ? "text-gray-400" : "text-gray-700 hover:text-gray-900"}`} />
                </button>
            </div>
        </Suspense>
    )
}