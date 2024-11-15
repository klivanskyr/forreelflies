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
    
    return (
        <div>
            <h1>Store Manager</h1>
        </div>
    )
}