'use client';

import { useUser } from "@/contexts/UserContext";
import NavigationHeader from "./NavigationHeader";
import ProfileHeader from "@/components/Navbar/ProfileHeader";
import { useEffect, useState } from "react";

export default function Navbar() {
    const { user } = useUser();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsScrolled(scrollPosition > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
            <div className={`w-full flex flex-col justify-center border-b-[1px] border-gray-200 transition-all duration-300`}>
                <ProfileHeader user={user} className={isScrolled ? 'hidden' : ''} />
                <NavigationHeader isScrolled={isScrolled} />
            </div>
        </nav>
    )
}