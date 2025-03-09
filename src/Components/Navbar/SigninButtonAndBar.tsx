'use client';

import { Suspense } from "react";
import Button from "../buttons/Button";
import LoginSidebar from "../Sidebar/LoginSidebar";
import { useRouter, useSearchParams } from "next/navigation";

function SigninButtonAndBarContents(): JSX.Element {
    const router = useRouter();
    const searchParams = useSearchParams();
    const login = searchParams.has("login");

    const setSidebarOpen = (value: boolean) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set("login", "true");
        } else {
            newParams.delete("login");
        }
        router.push(`?${newParams.toString()}`, { scroll: false });
    }
    
    return (
        <>
            <Button className="mx-1.5" onClick={() => setSidebarOpen(!login)} text="Login/Signup" color="white" type="button" />
            <LoginSidebar open={login} setOpen={setSidebarOpen} />
        </>
    )
}

export default function SigninButtonAndBar(): JSX.Element {
    return (
        <Suspense fallback={<div className="flex flex-row w-full justify-end"><h1>Loading...</h1></div>}>
            <SigninButtonAndBarContents />
        </Suspense>
    )
}