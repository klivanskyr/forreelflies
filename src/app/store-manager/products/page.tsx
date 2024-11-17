import { Product, Vendor } from "@/app/types/types";
import StoreManagerTemplate from "@/Components/storeManagerHelpers/StoreManagerTemplate";
import Table from "@/Components/Table/Table";

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
    if (!vendor) {
        return (
            <div>
                <h1>Vendor not found</h1>
            </div>
        )
    }
    const products = await getProducts(vendor);

    return (
        <StoreManagerTemplate>
            <Table 
                columns={
                    [
                        { label: 'Name', key: (item: Product) => item.name },
                        { label: 'Price', key: (item: Product) => "$" + item.price.toFixed(2) },
                        { label: 'Stock', key: (item: Product) => item.stockStatus || "Unknown" },
                        { label: 'Posted', key: (item: Product) => item.isDraft ? "Draft" : "Posted" }
                    ]
                }
                items={products}
                itemsPerPage={5}
            />
        </StoreManagerTemplate>
    )
}