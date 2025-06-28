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
    const [loading, setLoading] = useState(true);

    const fetchVendorAndProducts = async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            // Fetch vendor
            const vendorResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor?userId=${user.uid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (vendorResponse.ok) {
                const vendorData = await vendorResponse.json();
                const vendorInfo = vendorData.vendor as Vendor;
                setVendor(vendorInfo);

                // Fetch products for this vendor
                const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product?vendorId=${vendorInfo.id}`);
                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    setProducts(productsData.data as Product[]);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendorAndProducts();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greenPrimary"></div>
                    <p className="text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    if (!vendor || !vendor.id) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor not found</h1>
                    <p className="text-gray-600">Unable to load vendor information. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <NoVendorRedirect vendor={vendor}>
            <StoreManagerTemplate>
                <StoreManagerProductsHeader vendorId={vendor.id} onProductAdded={fetchVendorAndProducts} />
                <StoreManagerProductsTable 
                    products={products} 
                    onProductUpdated={fetchVendorAndProducts}
                    vendorId={vendor.id}
                />
            </StoreManagerTemplate>
        </NoVendorRedirect>
    );
}