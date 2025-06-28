'use client';

import { usePathname, useRouter } from "next/navigation";
import { MdOutlineSpaceDashboard as DashboardIcon } from "react-icons/md";
import { LiaShippingFastSolid as OrdersIcon } from "react-icons/lia";
import { FaRegHeart as WishlistIcon } from "react-icons/fa";
import { IoSettingsOutline as SettingsIcon } from "react-icons/io5";
import { MdLogout as LogoutIcon } from "react-icons/md";
import { MdLocationOn as AddressIcon } from "react-icons/md";

import { TextLink } from "@/components/Links";
import SignOutButton from "@/components/buttons/SignOutButton";

export default function DashboardSidebar(): JSX.Element {
  const router = useRouter();
  const path = usePathname();

  const navLinks = [
    { 
      section: "Account",
      links: [
        { href: "/my-account", label: "Dashboard", icon: DashboardIcon },
        { href: "/my-account/edit-account", label: "Account Settings", icon: SettingsIcon },
        { href: "/my-account/edit-address", label: "Address Book", icon: AddressIcon },
      ]
    },
    {
      section: "Shopping",
      links: [
        { href: "/my-account/orders", label: "Orders", icon: OrdersIcon },
        { href: "/my-account/wishlist", label: "Wishlist", icon: WishlistIcon },
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {navLinks.map((section) => (
        <div key={section.section} className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            {section.section}
          </h3>
          {section.links.map(({ href, label, icon: Icon }) => {
            const isActive = path === href;
            return (
              <TextLink
                key={href}
                href={href}
                text={label}
                className={`w-full px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-green-50 text-green-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                startingIcon={
                  <Icon 
                    className={`w-5 h-5 ${
                      isActive 
                        ? "text-green-700" 
                        : "text-gray-400 group-hover:text-gray-600"
                    }`} 
                  />
                }
              />
            );
          })}
        </div>
      ))}

      <div className="mt-auto pt-6 border-t">
        <SignOutButton
          className="w-full px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          text="Sign Out"
          startingIcon={<LogoutIcon className="w-5 h-5 text-gray-400" />}
          onSignOut={() => router.refresh()}
        />
      </div>
    </div>
  );
}
