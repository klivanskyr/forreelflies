'use client';

import SignOutButton from "@/components/buttons/SignOutButton";
import { FaHome as HomeIcon } from "react-icons/fa";
import { FaImage as MediaIcon } from "react-icons/fa";
import { FaBoxOpen as ProductsIcon } from "react-icons/fa";
import { FaShoppingCart as OrdersIcon } from "react-icons/fa";
import { FaMoneyCheck as PaymentsIcon } from "react-icons/fa";
import { FaUser as CustomersIcon } from "react-icons/fa";
import { FaGift as PromotionsIcon } from "react-icons/fa";
import { FaUndo as RefundIcon } from "react-icons/fa";
import { FaStar as ReviewsIcon } from "react-icons/fa";
import { FaChartLine as ReportsIcon } from "react-icons/fa";
import { FaCog as SettingsIcon } from "react-icons/fa";
import { FaPowerOff as LogoutIcon } from "react-icons/fa";
import PathHighlightTextLink from "../Links/PathHighlightTextLink";

const classNames = {
    pathDiv: "!text-white",
    pathWrapper: "bg-greenPrimary",
    wrapper: "px-2 py-1",
    link: "w-fit",
    div: "w-fit",
}

export default function StoreManagerSidebar({ className="" }:{ className?: string }) {
    return (
        <div className={`${className} flex flex-col w-[15%]`}>
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/"
                text="Home" 
                startingIcon={<HomeIcon />} 
                path={"/store-manager"} 
            />
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/media"
                text="Media" 
                startingIcon={<MediaIcon />} 
                path={"/store-manager/media"}
            />
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/products"
                text="Products" 
                startingIcon={<ProductsIcon />} 
                path={"/store-manager/products"}
            />
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/orders"
                text="Orders" 
                startingIcon={<OrdersIcon />} 
                path={"/store-manager/orders"}
            />
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/payments"
                text="Payments" 
                startingIcon={<PaymentsIcon />} 
                path={"/store-manager/payments"}
            />
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/customers"
                text="Customers" 
                startingIcon={<CustomersIcon />} 
                path={"/store-manager/customers"}
            />
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/promotions"
                text="Promotions" 
                startingIcon={<PromotionsIcon />} 
                path={"/store-manager/promotions"}
            />
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/refund"
                text="Refund" 
                startingIcon={<RefundIcon />} 
                path={"/store-manager/refund"}
            />
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/reviews"
                text="Reviews" 
                startingIcon={<ReviewsIcon />} 
                path={"/store-manager/reviews"}
            />
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/reports"
                text="Reports" 
                startingIcon={<ReportsIcon />} 
                path={"/store-manager/reports"}
            />
            <PathHighlightTextLink 
                classNames={classNames}
                href="/store-manager/settings"
                text="Settings" 
                startingIcon={<SettingsIcon />} 
                path={"/store-manager/settings"}
            />
            <SignOutButton className="w-fit text-base px-2 py-1 !gap-2" text="Sign Out" startingIcon={<LogoutIcon className="w-[15px] h-[15px]"/>} />
        </div>
    )
}