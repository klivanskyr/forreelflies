'use client';

import { useRouter } from "next/navigation";
import Topbar from "./Topbar";
import Searchbar from "../inputs/Searchbar";
import { useEffect, useState } from "react";

export default function SearchTopbar({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
    const [search, setSearch] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        if (!open) {
            setSearch("");
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
            setOpen(false);
        }
    };

    return (
        <Topbar open={open} setOpen={setOpen}>
            <div className="flex flex-col items-center gap-8">
                <h1 className="text-2xl">What are you looking for?</h1>
                <Searchbar 
                    placeholder="Search..." 
                    classNames={{ form: "max-w-[450px]", input: "" }} 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    onSubmit={handleSubmit} 
                />
            </div>
        </Topbar>
    );
}