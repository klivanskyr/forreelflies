// import NavbarLink from "./NavbarLink"

import Link from "next/link";
import Underline from "./underline/Underline";
import HoverPopup from "../HoverPopup";
import TextLink from "../Links/textlink/TextLink";

export default function NavigationHeader() {
    return (
        <div className="flex flex-row justify-between gap-2 px-32 py-4">
            <div className="flex flex-row gap-8">
                <h1>Logo</h1>
                <div className="flex flex-row gap-2">
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
                            <h1 className="text-black hover:text-greenPrimary transition-all">TYPES</h1>
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
            <div className="flex flex-row gap-2">
                <h1>Search</h1>
                <h1>Cart</h1>
                <h1>Profile</h1>
            </div>
        </div>
    )
}