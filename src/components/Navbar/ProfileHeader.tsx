import { DbUser } from "@/lib/firebase-admin";
import { TextLink } from "../Links";
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";

export default function ProfileHeader({ user }: { user: DbUser | null }) {
    return (
        <div className="flex flex-row justify-between bg-gray-100 py-2 md:px-8 lg:px-32">
            <div className="px-4 py-1 flex flex-row gap-4">
                <FaFacebook size={30} />
                <FaInstagram size={30} />
            </div>
            <div>
                {user?.vendorSignUpStatus === "onboardingCompleted" 
                    ? <TextLink className="bg-greenPrimary px-4 py-1 rounded-full !text-white" text="Store Manager" href="/store-manager" />
                    : <TextLink className="bg-greenPrimary px-4 py-1 rounded-full !text-white" text="Become A Vendor" href="/vendor-signup" />
                }
            </div>
        </div>
    )
}