'use client';

import Image from "next/image";
import Topbar from "./Topbar";
import placeholder from "@/../public/placeholder.png";
import BasicCard from "../cards/BasicCard";
import { ButtonLink, TextLink } from "../Links";
import Searchbar from "../inputs/Searchbar";
import { useEffect, useState } from "react";

function Card({ src, alt, title, subtitle, link }: { src: string, alt: string, title: string, subtitle: string, link: string }) {
    return (
        <BasicCard>
            <div className="flex flex-col items-center justify-center gap-4">
                <Image src={src} alt={alt} width={200} height={200} />
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-3xl">{title}</h1>
                    <h2 className="text-sm">{subtitle}</h2>
                    <ButtonLink className="mt-4" href={link} text="SHOP NOW" />
                </div>
            </div>
        </BasicCard>
    )
}

export default function SearchTopbar({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
    const [search, setSearch] = useState<string>("");
    const [searchChanged, setSearchChanged] = useState<boolean>(false);

    useEffect(() => {
        if (search.length > 3) {
            setSearchChanged(true);
        }

        if (!open) {
            setSearch("");
            setSearchChanged(false);
        }
    }, [search, open]);

    return (
        <Topbar open={open} setOpen={setOpen} className={`${searchChanged ? "h-full duration-700 transition-all" : ""}`}>
            <div className="flex flex-col items-center gap-14">
                <h1 className="text-2xl">What are you looking for?</h1>
                <Searchbar placeholder="Search..." classNames={{ form: "max-w-[450px]", input: "" }} value={search} onChange={(e) => setSearch(e.target.value)} onSubmit={(e) => e.preventDefault()} />
                <div className="flex flex-row gap-2 items-center">
                    <h1 className="italic">TRENDING SEARCHES:</h1>
                    <TextLink href="/" text="Oil" className="!text-black hover:!text-white hover:bg-greenPrimary transition-all py-1.5 px-2" />
                    <TextLink href="/" text="Parfum" className="!text-black hover:!text-white hover:bg-greenPrimary transition-all py-1.5 px-2" />
                    <TextLink href="/" text="Fresh" className="!text-black hover:!text-white hover:bg-greenPrimary transition-all py-1.5 px-2"/>
                </div>
                <div className="flex flex-col gap-6 items-center mt-2 mb-8">
                    <h1 className="text-2xl">POPULAR CATEGORIES:</h1>
                    <div className="flex flex-row gap-8">
                        <Card src={placeholder.src} alt="placeholder" title="Dry Flies" subtitle="# Products" link="/" />
                        <Card src={placeholder.src} alt="placeholder" title="Nymphs" subtitle="# Products" link="/" />
                        <Card src={placeholder.src} alt="placeholder" title="Wet Flies" subtitle="# Products" link="/" />
                    </div>
                </div>
            </div>
        </Topbar>
    )
}