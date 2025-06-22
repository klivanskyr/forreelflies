'use client';

import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import StoreManagerVendorProfileEditor from "@/components/storeManagerHelpers/StoreManagerVendorProfileEditor";
import { Vendor } from "../types/types";
import NoXRedirect from "@/components/NoXRedirect";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { DbUser } from "@/lib/firebase-admin";

export default function Page() {
    const { user } = useUser();
    const [vendor, setVendor] = useState<Vendor | undefined>(undefined);

    useEffect(() => {
        const getVendor = async (user: DbUser) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor?userId=${user.uid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
    
            if (!response.ok) {
                return undefined;
            } else {
                const data = await response.json();
                return data.vendor as Vendor;
            }
        }

        if (user) {
            getVendor(user).then((data) => {
                setVendor(data);
            });
        }
    }, [user]);

    if (!vendor) {
        return (
            <div>
                <h1>Vendor not found</h1>
            </div>
        )
    }
    
    return (
        <NoXRedirect<Vendor> x={vendor} redirectUrl="/?login=true" alertMessage="You must be logged in as a vendor to access the store manager">
            <StoreManagerTemplate>
                <StoreManagerVendorProfileEditor vendor={vendor} onSave={() => {/* Optionally refetch vendor info */}} />
                <div className="flex flex-col p-2">
                    <div className="flex flex-row items-center shadow-lg border py-3 px-4">
                        <h1 className="min-w-[6rem] my-10 mx-12">STORE ICON</h1>
                        <div className="w-full flex flex-col items-center p-8 gap-2">
                            <h1 className="text-greenPrimary text-2xl">For Reel Flies Store Manager</h1>
                            <h2 className="text-xl">{vendor.storeName}</h2>
                        </div>
                    </div>
                </div>
            </StoreManagerTemplate>
        </NoXRedirect>
    )
}