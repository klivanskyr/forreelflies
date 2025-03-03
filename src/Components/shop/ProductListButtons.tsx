'use client';

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import IconButton from "../buttons/IconButton";
import { addKVToUrl } from "@/helpers/addKVToUrl";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Input from "../inputs/Input";
import { useState } from "react";

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

    return (
        <div className="flex justify-center items-center gap-1">
            {(page - 1 < 1) 
                ? <IconButton disabled icon={<FaChevronLeft className="fill-gray-500"/>} /> 
                : <IconButton onClick={() => changePage(page - 1)} icon={<FaChevronLeft />} />
            }
            <div className="flex flex-row items-baseline">
                <form onSubmit={(e) => { e.preventDefault(); changePage(parseInt(input))}} ><Input className="!w-[25px] !h-[25px] !p-0 !pb-0.5 text-center" value={input} onChange={(e) => setInput(e.target.value)} /></form>
                <p className="w-[50px] text-center">of {totalPages}</p>
            </div>
            {(page + 1 > totalPages)
                ? <IconButton disabled icon={<FaChevronRight className="fill-gray-500"/>} /> 
                : <IconButton onClick={() => changePage(page + 1)} icon={<FaChevronRight />} />
            }
        </div>
    )
}