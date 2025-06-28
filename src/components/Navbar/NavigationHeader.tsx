"use client";

import { useState } from "react";
import Underline from "./underline/Underline";
import HoverPopup from "../hoverComponents/HoverPopup";
import TextLink from "../Links/textlink/TextLink";
import logo from "@/../public/logo.jpeg";
import Image from "next/image";
import SigninButtonAndBar from "./SigninButtonAndBar";
import NavSearchTopBar from "./NavSearchTopBar";
import ProfileButtonAndBar from "./ProfileButtonAndBar";
import CartIcon from "./CartIcon";
import { useSession } from "next-auth/react";
import { FaBars, FaTimes } from "react-icons/fa";

export default function NavigationHeader({ isScrolled }: { isScrolled: boolean }) {
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    return (
        <>
            {/* Mobile Navigation (md:hidden) */}
            <div className="relative flex md:hidden items-center justify-between px-4 py-2 w-full bg-white">
                {/* Left Section - Hamburger */}
                <button 
                    className="flex items-center justify-center z-20 w-10"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? (
                        <FaTimes className="w-6 h-6" />
                    ) : (
                        <FaBars className="w-6 h-6" />
                    )}
                </button>

                {/* Center Section - Logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <Image 
                        src={logo.src} 
                        alt="logo" 
                        width={150} 
                        height={150} 
                        className={`transition-all duration-300 ${isScrolled ? 'w-[90px]' : 'w-[105px]'} h-auto`}
                    />
                </div>

                {/* Right Section - Icons */}
                <div className="flex items-center gap-2">
                    <NavSearchTopBar />
                    <CartIcon />
                    {session?.user 
                        ? <ProfileButtonAndBar isVendor={session.user.isVendor || false} /> 
                        : <SigninButtonAndBar />
                    }
                </div>

                {/* Mobile Navigation Links - Hidden Menu */}
                <div className={`${isMenuOpen ? 'block' : 'hidden'} absolute top-full left-0 right-0 bg-white p-4 border-b shadow-lg z-10`}>
                    <div className="flex flex-col items-start gap-6">
                        <Underline>
                            <TextLink href="/" text="HOME" className="!text-black hover:!text-greenPrimary transition-all" />
                        </Underline>
                        <Underline>
                            <TextLink href="/shop" text="SHOP" className="!text-black hover:!text-greenPrimary transition-all" />
                        </Underline>
                        <div className="relative">
                            <HoverPopup
                                classNames={{ "hover": "border pl-10 py-8 bg-white" }}
                                hoverElement={
                                    <div className="flex flex-col gap-8 w-64">
                                        <TextLink href="/shop?category=dry-flies" text="Dry Flies" />
                                        <TextLink href="/shop?category=nymphs" text="Nymphs" />
                                        <TextLink href="/shop?category=streamers" text="Streamers" />
                                        <TextLink href="/shop?category=saltwater-flies" text="Saltwater Flies" />
                                        <TextLink href="/shop?category=wet-flies" text="Wet Flies" />
                                    </div>
                                }
                            >
                                <h1 className="text-black hover:text-greenPrimary transition-all text-lg">TYPES</h1>
                            </HoverPopup>
                        </div>
                        <Underline>
                            <TextLink href="/about" text="ABOUT US" className="!text-black hover:!text-greenPrimary transition-all" />
                        </Underline>
                        <Underline>
                            <TextLink href="/contact" text="CONTACT US" className="!text-black hover:!text-greenPrimary transition-all" />
                        </Underline>
                    </div>
                </div>
            </div>

            {/* Desktop Navigation (hidden md:flex) */}
            <div className="hidden md:flex">
                {/* Main Navigation */}
                <div className="flex items-center px-8 lg:px-32 py-4 w-full">
                    {/* Logo - Left */}
                    <div className="flex-shrink-0 pointer-events-none">
                        <Image 
                            src={logo.src} 
                            alt="logo" 
                            width={150} 
                            height={150} 
                            className={`transition-all duration-300 ${isScrolled ? 'w-[125px]' : 'w-[150px]'} h-auto`}
                        />
                    </div>

                    {/* Center - Navigation Links */}
                    <div className="flex-grow flex items-center justify-center gap-8">
                        <Underline>
                            <TextLink href="/" text="HOME" className="!text-black hover:!text-greenPrimary transition-all" />
                        </Underline>
                        <Underline>
                            <TextLink href="/shop" text="SHOP" className="!text-black hover:!text-greenPrimary transition-all" />
                        </Underline>
                        <div className="relative">
                            <HoverPopup
                                classNames={{ "hover": "border pl-10 py-8 bg-white" }}
                                hoverElement={
                                    <div className="flex flex-col gap-8 w-64">
                                        <TextLink href="/shop?category=dry-flies" text="Dry Flies" />
                                        <TextLink href="/shop?category=nymphs" text="Nymphs" />
                                        <TextLink href="/shop?category=streamers" text="Streamers" />
                                        <TextLink href="/shop?category=saltwater-flies" text="Saltwater Flies" />
                                        <TextLink href="/shop?category=wet-flies" text="Wet Flies" />
                                    </div>
                                }
                            >
                                <h1 className="text-black hover:text-greenPrimary transition-all text-lg">TYPES</h1>
                            </HoverPopup>
                        </div>
                        <Underline>
                            <TextLink href="/about" text="ABOUT US" className="!text-black hover:!text-greenPrimary transition-all" />
                        </Underline>
                        <Underline>
                            <TextLink href="/contact" text="CONTACT US" className="!text-black hover:!text-greenPrimary transition-all" />
                        </Underline>
                    </div>

                    {/* Right - Icons */}
                    <div className="flex-shrink-0 flex items-center gap-4">
                        <NavSearchTopBar />
                        <CartIcon />
                        {session?.user 
                            ? <ProfileButtonAndBar isVendor={session.user.isVendor || false} /> 
                            : <SigninButtonAndBar />
                        }
                    </div>
                </div>
            </div>
        </>
    );
}