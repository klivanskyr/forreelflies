'use client';

import { useUser } from "@/contexts/UserContext";
import { useEffect } from "react";

export default function IntializeUser() {
    const { user, refreshUser } = useUser();

    useEffect(() => {
        if (!user) {
            refreshUser();
        }
    });

    return (
        <></>
    )
}