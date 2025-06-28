'use client';

import { signOut } from "next-auth/react";

export default function SignOutButton({ text, startingIcon, onSignOut=() => {}, className="" }: { text: string, startingIcon?: JSX.Element, onSignOut?: () => void, className?: string }) {
    const handleSignOut = async () => {
        try {
            await signOut({ redirect: false });
            onSignOut();
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    }

    return (
        <button className={`${className} linkhover text-lg w-fit flex flex-row items-center gap-1.5`} 
            onClick={handleSignOut}
        >
            {startingIcon ? startingIcon : <></>}
            <h1>{text}</h1>
        </button>
    )
}