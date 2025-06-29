'use client';

import { Suspense } from "react";
import IconButton from "../buttons/IconButton";
import LoginSidebar from "../Sidebar/LoginSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { CgProfile } from "react-icons/cg";

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
            <IconButton 
                onClick={() => setSidebarOpen(!login)} 
                icon={<CgProfile className="w-[25px] 2xl:w-[30px] h-[25px] 2xl:h-[30px]"/>} 
            />
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