'use client';

import { Vendor } from "@/app/types/types";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

export default function NoVendorRedirect({ children, vendor }: { children: React.ReactNode, vendor: Vendor | undefined }) {
    const router = useRouter();
    const { user } = useUser();

    // Allow access if user is a vendor (has vendorActive status) even if vendor document doesn't exist yet
    // This handles the case where admin approval just happened and vendor document is being created
    if (!vendor && user?.vendorSignUpStatus !== "vendorActive" && user?.vendorSignUpStatus !== "onboardingStarted" && user?.vendorSignUpStatus !== "onboardingCompleted") {
        router.push('/');
        return <></>
    }

    return (
        <>
            {children}
        </>
    )
}