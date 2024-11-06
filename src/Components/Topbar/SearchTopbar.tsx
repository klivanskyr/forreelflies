'use client';

import Image from "next/image";
import Topbar from "./Topbar";
import placeholder from "@/../public/placeholder.png";
import BasicCard from "../cards/BasicCard";
import { ButtonLink, TextLink } from "../Links";
import Searchbar from "../inputs/Searchbar";
import { useState } from "react";

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

    return (
        <Topbar open={open} setOpen={setOpen} className={`${search.length > 3 ? "h-[100%] duration-700 transition-all" : "h-[80%]"}`}>
            <div className="flex flex-col items-center gap-12">
                <h1 className="text-2xl">What are you looking for?</h1>
                <Searchbar classNames={{ form: "max-w-[450px]", input: "" }} value={search} onChange={(e) => setSearch(e.target.value)} />
                <div className="flex flex-row gap-2 items-center">
                    <h1 className="italic">TRENDING SEARCHES:</h1>
                    <TextLink href="/" text="Oil" className="!text-black hover:!text-white hover:bg-greenPrimary transition-all py-1.5 px-2" />
                    <TextLink href="/" text="Parfum" className="!text-black hover:!text-white hover:bg-greenPrimary transition-all py-1.5 px-2" />
                    <TextLink href="/" text="Fresh" className="!text-black hover:!text-white hover:bg-greenPrimary transition-all py-1.5 px-2"/>
                </div>
                <div className="flex flex-col gap-2 items-center mt-2 mb-8">
                    <h1 className="text-2xl">POPULAR CATEGORIES:</h1>
                    <div className="flex flex-row gap-2">
                        <Card src={placeholder.src} alt="placeholder" title="Dry Flies" subtitle="# Products" link="/" />
                        <Card src={placeholder.src} alt="placeholder" title="Nymphs" subtitle="# Products" link="/" />
                        <Card src={placeholder.src} alt="placeholder" title="Wet Flies" subtitle="# Products" link="/" />
                    </div>
                </div>
            </div>
        </Topbar>
    )
}