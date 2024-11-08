'use client';

import { useState } from "react";
import Button from "../buttons/Button";
import LoginSidebar from "../Sidebar/LoginSidebar";

export default function SigninButtonAndBar() {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    
    return (
        <>
            <Button onClick={() => setSidebarOpen(prev => !prev)} text="Login/Signup" color="white" type="button" />
            <LoginSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        </>
    )
}