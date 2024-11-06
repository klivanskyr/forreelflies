'use client';

import Underline from "./underline/Underline";
import HoverPopup from "../hoverComponents/HoverPopup";
import TextLink from "../Links/textlink/TextLink";
import logo from "@/../public/logo.jpeg";
import Image from "next/image";
import Button from "../buttons/Button";
import { useState } from "react";
import LoginSidebar from "../Sidebar/LoginSidebar";
import IconButton from "../buttons/IconButton";
import { IoSearchOutline as SearchIcon } from "react-icons/io5";
import SearchTopbar from "../Topbar/SearchTopbar";


export default function NavigationHeader() {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [topbarOpen, setTopbarOpen] = useState<boolean>(false);

    return (
        <div className="flex flex-row items-center justify-between gap-2 px-32 py-4">
            <div className="flex flex-row items-center gap-8">
                <Image src={logo.src} alt="logo" width={200} height={200} />
                <div className="flex flex-row gap-4">
                    <Underline>
                        <TextLink href="/" text="HOME" className="!text-black hover:!text-greenPrimary transition-all" />
                    </Underline>
                    <Underline>
                        <TextLink href="/shop" text="SHOP" className="!text-black hover:!text-greenPrimary transition-all" />
                    </Underline>
                    <Underline>
                        <HoverPopup
                            classNames={{ "hover": "border pl-10 py-8 bg-white" }}
                            hoverElement={
                                <div className="flex flex-col gap-8 w-64">
                                    <TextLink href="/" text="Link 1" />
                                    <TextLink href="/" text="Link 2" />
                                    <TextLink href="/" text="Link 3" />
                                </div>
                            }
                        >
                            <h1 className="text-black hover:text-greenPrimary transition-all text-lg">TYPES</h1>
                        </HoverPopup>
                    </Underline>
                    <Underline>
                        <TextLink href="/about" text="ABOUT US" className="!text-black hover:!text-greenPrimary transition-all" />
                    </Underline>
                    <Underline>
                        <TextLink href="/contact" text="CONTACT US" className="!text-black hover:!text-greenPrimary transition-all" />
                    </Underline>
                </div>
            </div>
            <div className="flex flex-row gap-2 items-center justify-center">
                <IconButton onClick={() => setTopbarOpen(prev => !prev)} icon={<SearchIcon className="w-[25px] h-[25px]" />}/>
                <SearchTopbar open={topbarOpen} setOpen={setTopbarOpen} />
                <h1>Cart</h1>
                <Button onClick={() => setSidebarOpen(prev => !prev)} text="Login/Signup" color="white" type="button" />
                <LoginSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
            </div>
        </div>
    )
}