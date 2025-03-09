'use client';

import { MdOutlineSpaceDashboard as DashboardIcon } from "react-icons/md";
import { LiaShippingFastSolid as OrdersIcon } from "react-icons/lia";
import { FaRegHeart as WishlistIcon } from "react-icons/fa";
import { MdOutlinePayment as PaymentIcon } from "react-icons/md";
import { IoSettingsOutline  as SettingsIcon } from "react-icons/io5";
import { MdLogout as LogoutIcon } from "react-icons/md";

import { TextLink } from "@/Components/Links";
import SignOutButton from "@/Components/buttons/SignOutButton";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";

export default function DashboardSidebar(): JSX.Element {
    const router = useRouter();
    const path = usePathname();
    
    return (
        <Suspense fallback={<div className="flex flex-col gap-1">Loading...</div>}>
            <div className="flex flex-col gap-1">
                <TextLink className={`w-fit ${path === "/my-account" ? "!text-greenPrimary" : ""}`} href="/my-account" text="Dashboard" startingIcon={<DashboardIcon className={`${path === "/my-account" ? "fill-greenPrimary" : ""}`}/>} />
                <TextLink className={`w-fit ${path === "/my-account/orders" ? "!text-greenPrimary" : ""}`} href="/my-account/orders" text="Orders" startingIcon={<OrdersIcon className={`${path === "/my-account/orders" ? "fill-greenPrimary" : ""}`}/>} />
                <TextLink className={`w-fit ${path === "/my-account/wishlist" ? "!text-greenPrimary" : ""}`} href="/my-account/wishlist" text="Wishlist" startingIcon={<WishlistIcon className={`${path === "/my-account/wishlist" ? "fill-greenPrimary" : ""}`}/>} />
                <TextLink className={`w-fit ${path === "/my-account/payment-methods" ? "!text-greenPrimary" : ""}`} href="/my-account/payment-methods" text="Payment Methods" startingIcon={<PaymentIcon className={`${path === "/my-account/payment-methods" ? "fill-greenPrimary" : ""}`}/>} />
                <TextLink className={`w-fit ${path === "/my-account/edit-account" ? "!text-greenPrimary" : ""}`} href="/my-account/edit-account" text="Account Settings" startingIcon={<SettingsIcon className={`${path === "/my-account/account-settings" ? "fill-greenPrimary" : ""}`}/>} />
                <TextLink className={`w-fit ${path === "/my-account/edit-address" ? "!text-greenPrimary" : ""}`} href="/my-account/edit-address" text="Address Book" startingIcon={<SettingsIcon className={`${path === "/my-account/address-book" ? "fill-greenPrimary" : ""}`}/>} />
                <SignOutButton className="w-fit" text="Sign Out" startingIcon={<LogoutIcon />} onSignOut={() => router.refresh()}/>
            </div>
        </Suspense>
    )
}