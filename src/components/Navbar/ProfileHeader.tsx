import { DbUser } from "@/lib/firebase-admin";
import { TextLink } from "../Links";
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";

export default function ProfileHeader({ user, className = '' }: { user: DbUser | null, className?: string }) {
    return (
        <div className={`flex flex-row justify-between bg-gray-100 py-2 px-4 md:px-8 lg:px-32 transition-all duration-300 ${className}`}>
            <div className="flex flex-row gap-3 md:gap-4">
                <FaFacebook className="w-6 h-6 md:w-[30px] md:h-[30px]" />
                <FaInstagram className="w-6 h-6 md:w-[30px] md:h-[30px]" />
            </div>
            <div>
                {user?.vendorSignUpStatus === "onboardingCompleted" 
                    ? <TextLink 
                        className="bg-greenPrimary px-3 md:px-4 py-1 rounded-full !text-white text-sm md:text-base" 
                        text="Store Manager" 
                        href="/store-manager" 
                      />
                    : <TextLink 
                        className="bg-greenPrimary px-3 md:px-4 py-1 rounded-full !text-white text-sm md:text-base" 
                        text="Become A Vendor" 
                        href="/vendor-signup" 
                      />
                }
            </div>
        </div>
    )
}