'use client';

import { Vendor } from "@/app/types/types";
import { useRouter } from "next/navigation";

export default function NoVendorRedirect({ children, vendor }: { children: React.ReactNode, vendor: Vendor }) {
    const router = useRouter();

    if (!vendor) {
        // alert("Must be a vendor to access this page");
        router.push('/');
        return <></>
    }

    return (
        <>
            {children}
        </>
    )
}