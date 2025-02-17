import DashboardTemplate from "@/Components/dashboardHelpers/dashboardTemplate";
import AddressPage from "@/Components/my-account/AddressPage";

export default async function Page() {
    const { tokenToUser } = await import("@/lib/firebase-admin");
    const user = await tokenToUser();

    if (!user) {
        return <></>;
    }

    return (
        <>
            <DashboardTemplate user={user}>
                <AddressPage user={user} />
            </DashboardTemplate>
        </>
    )
}