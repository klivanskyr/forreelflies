import { TextLink } from "../Links";
import { FaFacebook } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";

export default async function ProfileHeader() {
    const { tokenToUser } = await import("@/lib/firebase-admin");
    const user = await tokenToUser();

    return (
        <div className="flex flex-row justify-between bg-gray-100 px-32 py-2">
            <div className="px-4 py-1 flex flex-row gap-4">
                <FaFacebook size={30} />
                <FaInstagram size={30} />
            </div>
            <div>
                {user?.isVendor 
                    ? <TextLink className="bg-greenPrimary px-4 py-1 rounded-full !text-white" text="Store Manager" href="/store-manager" />
                    : <TextLink className="bg-greenPrimary px-4 py-1 rounded-full !text-white" text="Become A Vendor" href="/vendor-signup" />
                }
            </div>
        </div>
    )
}