'use client';

import { useState } from "react";
import { CgProfile } from "react-icons/cg";
import IconButton from "../buttons/IconButton";
import ProfileSidebar from "../Sidebar/ProfileSidebar";

export default function ProfileButtonAndBar({ isVendor }: { isVendor: boolean }) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    
    return (
        <>
            <IconButton onClick={() => setSidebarOpen(prev => !prev)} icon={<CgProfile className="w-[25px] 2xl:w-[30px] h-[25px] 2xl:h-[30px]"/>} />
            <ProfileSidebar isVendor={isVendor} open={sidebarOpen} setOpen={setSidebarOpen} />
        </>
    )
}