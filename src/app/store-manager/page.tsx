import StoreManagerTemplate from "@/Components/storeManagerHelpers/StoreManagerTemplate";

type Vendor = {
    id: string,
    storeName: string,
    storeStreetAddress: string,
    storeCountry: string,
    storeZip: string,
    storeState: string,
    storeDescription: string,
    storePhone: string,
    storeSlug: string,
    storeCity: string,
    storeEmail: string,
}

export default async function Page() {
    const { tokenToUser } = await import("@/lib/firebase-admin");
    const user = await tokenToUser();

    const getVendor = async (userId: string) => {
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

    if (!user || !user?.isVendor ) {
        return (
            <div>
                <h1>Not a vendor</h1>
            </div>
        )
    }

    const vendor = await getVendor(user.uid);

    if (!vendor) {
        return (
            <div>
                <h1>Vendor not found</h1>
            </div>
        )
    }
    
    return (
        <StoreManagerTemplate>
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
    )
}