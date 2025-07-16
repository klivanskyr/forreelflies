'use client';

import { DbUser } from "@/lib/firebase-admin";
import { TextLink } from "../Links";
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function ProfileHeader({ user }: { user: DbUser | null }) {
    const router = useRouter();
    const { data: session } = useSession();

    // Use session data if available, otherwise fall back to user prop
    const currentUser = session?.user || user;



    const handleBecomeVendorClick = () => {
        if (!currentUser) {
            toast.error("Please sign in to become a vendor");
            router.push("?login=true");
            return;
        }
        router.push("/vendor-signup");
    };

    return (
        <div className="flex flex-row justify-between bg-gray-100 py-2 px-4 md:px-8 lg:px-32">
            <div className="flex flex-row gap-3 md:gap-4">
                <FaFacebook className="w-6 h-6 md:w-[30px] md:h-[30px]" />
                <FaInstagram className="w-6 h-6 md:w-[30px] md:h-[30px]" />
            </div>
            <div>
                {currentUser?.vendorSignUpStatus === "vendorActive" || currentUser?.vendorSignUpStatus === "onboardingStarted" || currentUser?.vendorSignUpStatus === "onboardingCompleted" 
                    ? <TextLink 
                        className="bg-greenPrimary px-3 md:px-4 py-1 rounded-full !text-white text-sm md:text-base" 
                        text="Store Manager" 
                        href="/store-manager" 
                      />
                    : <button 
                        className="bg-greenPrimary px-3 md:px-4 py-1 rounded-full text-white text-sm md:text-base hover:bg-green-600 transition-colors" 
                        onClick={handleBecomeVendorClick}
                      >
                        Become A Vendor
                      </button>
                }
            </div>
        </div>
    )
}