import Breadcrumbs from "@/Components/Breadcrumbs";
import NoXRedirect from "@/Components/NoXRedirect";

export default async function Page() {
    const { tokenToUser } = await import("@/lib/firebase-admin");
    const user = await tokenToUser();

    return (
        <NoXRedirect x={user} redirectUrl="/?login=true">
            <div className="flex flex-col w-full h-full items-center gap-4">
                <Breadcrumbs
                    breadcrumbs={[
                        { name: "Shopping Cart", href: "/cart" },
                        { name: "Checkout", href: "/checkout" },
                        { name: "Order Status", href: "/" },
                    ]}
                    activeIndex={1}
                />
                <div className="flex flex-row w-full">
                    {/* Billing Information */}
                    <div className="w-full">

                    </div>
                    
                    {/* Order Information */}
                    <div className="w-full">
                        
                    </div>
                </div>
            </div>
        </NoXRedirect>
    )
}