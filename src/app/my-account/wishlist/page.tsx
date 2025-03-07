export const dynamic = "force-dynamic";

import DashboardTemplate from "@/Components/dashboardHelpers/dashboardTemplate";

export default async function Page() {
    const { tokenToUser } = await import("@/lib/firebase-admin");
    const user = await tokenToUser();

    if (!user) {
        return <></>;
    }

    return (
        <DashboardTemplate user={user}>
            <h1>Wishlist</h1>
        </DashboardTemplate>
    )
}