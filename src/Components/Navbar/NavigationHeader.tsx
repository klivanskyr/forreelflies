"use server";
import Underline from "./underline/Underline";
import HoverPopup from "../hoverComponents/HoverPopup";
import TextLink from "../Links/textlink/TextLink";
import logo from "@/../public/logo.jpeg";
import Image from "next/image";
import SigninButtonAndBar from "./SigninButtonAndBar";
import NavSearchTopBar from "./NavSearchTopBar";
import ProfileButtonAndBar from "./ProfileButtonAndBar";
import Link from "next/link";
import { FiShoppingCart } from "react-icons/fi";

export default async function NavigationHeader() {
    const { tokenToUser } = await import("@/lib/firebase-admin");
    const user = await tokenToUser();
    
    return (
        <div className="flex flex-row items-center justify-between gap-2 md:px-8 lg:px-32">
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
                <NavSearchTopBar />
                <Link href="/cart"><FiShoppingCart className="h-6 w-6" /></Link>
                {user ? <ProfileButtonAndBar isVendor={user.isVendor} /> : <SigninButtonAndBar />}
            </div>
        </div>
    )
}