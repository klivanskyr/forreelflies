// import NavbarLink from "./NavbarLink"

import Link from "next/link";
import Underline from "./underline/Underline";

export default function NavigationHeader() {
    return (
        <div className="flex flex-row justify-between gap-2 px-32">
            <div className="flex flex-row gap-8">
                <h1>Logo</h1>
                <div className="flex flex-row gap-2">
                    <Underline>
                        <Link href="/">HOME</Link>
                    </Underline>
                    <Underline>
                        <Link href="/shop">SHOP</Link>
                    </Underline>
                    <Underline>
                        <Link href="/type">TYPE</Link>
                    </Underline>
                    <Underline>
                        <Link href="/about">ABOUT US</Link>
                    </Underline>
                    <Underline>
                        <Link href="/contact">CONTACT US</Link>
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