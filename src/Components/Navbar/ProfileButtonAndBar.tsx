'use client';

import { useState } from "react";
import { CgProfile } from "react-icons/cg";
import IconButton from "../buttons/IconButton";
import ProfileSidebar from "../Sidebar/ProfileSidebar";
import { User } from "firebase/auth";

export default function ProfileButtonAndBar({ user }: { user: User }) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    
    return (
        <>
            <IconButton onClick={() => setSidebarOpen(prev => !prev)} icon={<CgProfile className="w-[25px] h-[25px]"/>} />
            <ProfileSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        </>
    )
}