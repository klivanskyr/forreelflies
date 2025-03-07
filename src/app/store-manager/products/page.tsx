'use server';

import { Product, Vendor } from "@/app/types/types";
import NoVendorRedirect from "@/Components/storeManagerHelpers/NoVendorRedirect";
import StoreManagerProductsTable from "@/Components/storeManagerHelpers/StoreManagerProductsTable";
import StoreManagerTemplate from "@/Components/storeManagerHelpers/StoreManagerTemplate";
import StoreManagerProductsHeader from "@/Components/StoreManagerProductsHeader";

export default async function Page() {
    const { tokenToUser } = await import("@/lib/firebase-admin");
    const user = await tokenToUser();

    if (!user || !user?.isVendor ) {
        return (
            <div>
                <h1>Not a vendor</h1>
            </div>
        )
    }

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

    const vendor = await getVendor(user.uid);
    if (!vendor  || !vendor.id) {
        return (
            <div>
                <h1>Vendor not found</h1>
            </div>
        )
    }
    const products = await getProducts(vendor);

    return (
        <NoVendorRedirect vendor={vendor}>
            <StoreManagerTemplate>
                <StoreManagerProductsHeader vendorId={vendor.id} />
                <StoreManagerProductsTable products={products} />
            </StoreManagerTemplate>
        </NoVendorRedirect>
    )
}