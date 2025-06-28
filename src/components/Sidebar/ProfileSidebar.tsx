import SignoutButton from "../buttons/SignOutButton";
import { TextLink } from "../Links";
import Sidebar from "./Sidebar";
import { useRouter, usePathname } from "next/navigation";
import { MdOutlineSpaceDashboard as DashboardIcon } from "react-icons/md";
import { LiaShippingFastSolid as OrdersIcon } from "react-icons/lia";
import { FaRegHeart as WishlistIcon } from "react-icons/fa";
import { FaMapMarkerAlt as AddressIcon } from "react-icons/fa";
import { MdOutlinePayment as PaymentIcon } from "react-icons/md";
import { IoSettingsOutline as SettingsIcon } from "react-icons/io5";
import { MdLogout as LogoutIcon } from "react-icons/md";
import { FaStore as StoreIcon } from "react-icons/fa";

export default function ProfileSidebar({ isVendor, open, setOpen }: { isVendor: boolean, open: boolean, setOpen: (open: boolean) => void }) {
    const router = useRouter();
    const pathname = usePathname();

    const onSignOut = () => {
        setOpen(false);
        router.refresh();
    }

    const navLinks = [
        ...(isVendor ? [{ href: "/store-manager", text: "STORE MANAGER", icon: StoreIcon }] : []),
        { href: "/my-account", text: "DASHBOARD", icon: DashboardIcon },
        { href: "/my-account/orders", text: "ORDERS", icon: OrdersIcon },
        { href: "/my-account/wishlist", text: "WISHLIST", icon: WishlistIcon },
        { href: "/my-account/edit-address", text: "ADDRESSES", icon: AddressIcon },
        { href: "/my-account/payment-methods", text: "PAYMENT METHODS", icon: PaymentIcon },
        { href: "/my-account/edit-account", text: "ACCOUNT SETTINGS", icon: SettingsIcon },
    ];

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <div className="flex flex-col h-full px-6 py-8">
                <h1 className="text-2xl font-semibold mb-8 text-center">My Account</h1>
                <div className="flex flex-col gap-4 flex-grow">
                    {navLinks.map(({ href, text, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <TextLink 
                                key={href}
                                href={href} 
                                text={text} 
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                                    isActive 
                                        ? "bg-green-50 text-green-700 font-medium" 
                                        : "hover:bg-gray-50"
                                }`}
                                startingIcon={
                                    <Icon className={`w-5 h-5 ${isActive ? "text-green-700" : "text-gray-500"}`} />
                                }
                            />
                        );
                    })}
                </div>
                <div className="mt-auto pt-4 border-t">
                    <SignoutButton 
                        text="LOGOUT" 
                        onSignOut={onSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-left hover:bg-red-50 hover:text-red-600 transition-all"
                        startingIcon={<LogoutIcon className="w-5 h-5" />}
                    />
                </div>
            </div>
        </Sidebar>
    );
}