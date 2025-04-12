'use client';

import { Product, Vendor } from "@/app/types/types";
import NoVendorRedirect from "@/components/storeManagerHelpers/NoVendorRedirect";
import StoreManagerProductsTable from "@/components/storeManagerHelpers/StoreManagerProductsTable";
import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import StoreManagerProductsHeader from "@/components/StoreManagerProductsHeader";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";

export default function Page() {
    const { user } = useUser();
    const [vendor, setVendor] = useState<Vendor | undefined>(undefined);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const getVendor = async (userId: string): Promise<Vendor | undefined> => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor?userId=${userId}`, {
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

        const getProducts = async (vendor: Vendor): Promise<Product[]> => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product?vendorId=${vendor.id}`);
            const data = await response.json();
            return data.data as Product[];
        }

        if (user) {
            getVendor(user.uid).then((data) => {
                if (data) {
                    setVendor(data);
                    getProducts(data).then((products) => {
                        setProducts(products);
                    });
                }
            });
        }
    })

    if (!vendor  || !vendor.id) {
        return (
            <div>
                <h1>Vendor not found</h1>
            </div>
        )
    }

    if (!user || !user?.isVendor ) {
        return (
            <div>
                <h1>Not a vendor</h1>
            </div>
        )
    }

    return (
        <NoVendorRedirect vendor={vendor}>
            <StoreManagerTemplate>
                <StoreManagerProductsHeader vendorId={vendor.id} />
                <StoreManagerProductsTable products={products} />
            </StoreManagerTemplate>
        </NoVendorRedirect>
    )
}