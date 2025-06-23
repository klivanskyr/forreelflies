'use client';

import { useUser } from "@/contexts/UserContext";
import NavigationHeader from "./NavigationHeader";
import ProfileHeader from "@/components/Navbar/ProfileHeader";

export default function Navbar() {
    const { user } = useUser();

    return (
        <div className="flex w-full flex-col justify-center border-b-[1px] border-gray-200">
            <ProfileHeader user={user} />
            <NavigationHeader />
        </div>
    )
}