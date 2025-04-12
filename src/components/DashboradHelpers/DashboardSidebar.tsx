'use client';

import { usePathname, useRouter } from "next/navigation";
import { MdOutlineSpaceDashboard as DashboardIcon } from "react-icons/md";
import { LiaShippingFastSolid as OrdersIcon } from "react-icons/lia";
import { FaRegHeart as WishlistIcon } from "react-icons/fa";
import { MdOutlinePayment as PaymentIcon } from "react-icons/md";
import { IoSettingsOutline as SettingsIcon } from "react-icons/io5";
import { MdLogout as LogoutIcon } from "react-icons/md";

import { TextLink } from "@/Components/Links";
import SignOutButton from "@/Components/buttons/SignOutButton";

export default function DashboardSidebar(): JSX.Element {
  const router = useRouter();
  const path = usePathname();

  const navLinks = [
    { href: "/my-account", label: "Dashboard", icon: DashboardIcon },
    { href: "/my-account/orders", label: "Orders", icon: OrdersIcon },
    { href: "/my-account/wishlist", label: "Wishlist", icon: WishlistIcon },
    { href: "/my-account/payment-methods", label: "Payment Methods", icon: PaymentIcon },
    { href: "/my-account/edit-account", label: "Account Settings", icon: SettingsIcon },
    { href: "/my-account/edit-address", label: "Address Book", icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col gap-1">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive = path === href;
        return (
          <TextLink
            key={href}
            href={href}
            text={label}
            className={`w-fit ${isActive ? "text-black" : "text-gray-500"}`}
            startingIcon={<Icon className={`${isActive ? "fill-black" : "fill-gray-500"}`} />}
          />
        );
      })}

      <SignOutButton
        className="w-fit"
        text="Sign Out"
        startingIcon={<LogoutIcon />}
        onSignOut={() => router.refresh()}
      />
    </div>
  );
}
