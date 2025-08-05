'use client';

import { useUser } from "@/contexts/UserContext";
import NavigationHeader from "./NavigationHeader";
import ProfileHeader from "@/components/Navbar/ProfileHeader";
import { useEffect, useState, useRef } from "react";

export default function Navbar() {
    const { user } = useUser();
    const [isSticky, setIsSticky] = useState(false);
    const profileHeaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (profileHeaderRef.current) {
                const profileHeaderHeight = profileHeaderRef.current.offsetHeight;
                const scrollPosition = window.scrollY;
                // Make NavigationHeader sticky when ProfileHeader is scrolled past
                setIsSticky(scrollPosition > profileHeaderHeight);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={`${isSticky ? 'sticky top-0' : 'relative'} z-50`}>
            {/* ProfileHeader - Normal document flow */}
            <div ref={profileHeaderRef}>
                <ProfileHeader user={user} />
            </div>
            
            {/* NavigationHeader - Conditionally sticky */}
            <nav className={`left-0 right-0 z-50 bg-white transition-all duration-300 ${isSticky ? 'shadow-md' : ''} border-b-[1px] border-gray-200`}>
                <NavigationHeader isScrolled={isSticky} />
            </nav>
        </div>
    )
}