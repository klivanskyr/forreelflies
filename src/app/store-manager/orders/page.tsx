import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";

export default function Page() {
    const { user } = useUser();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/v1/stripe/webhook?vendorId=${user.uid}`);
                const data = await res.json();
                setOrders(data.orders || []);
            } catch (err) {
                setError("Failed to fetch orders");
            }
            setLoading(false);
        };
        fetchOrders();
    }, [user]);

    const handleWithdraw = async () => {
        if (!user) return;
        await fetch(`/api/v1/vendor/withdraw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vendorId: user.uid }),
        });
        // Optionally refetch orders
    };

    return (
        <StoreManagerTemplate>
            <h1 className="text-2xl font-bold mb-4">Orders</h1>
            {loading ? <div>Loading...</div> : error ? <div>{error}</div> : (
                <div className="space-y-6">
                    {orders.length === 0 && <div>No orders found.</div>}
                    {orders.map((order) => (
                        <div key={order.id} className="border rounded p-4 bg-white shadow">
                            <div className="mb-2 font-semibold">Order #{order.id}</div>
                            <div className="mb-2">Amount: ${order.amount}</div>
                            <div className="mb-2">Status: {order.payoutStatus}</div>
                            <div className="mb-2">Purchase Date: {order.purchaseDate && new Date(order.purchaseDate.seconds * 1000).toLocaleDateString()}</div>
                            <div className="mb-2">Products:
                                <ul className="list-disc ml-6">
                                    {order.products && order.products.map((p: any, i: number) => (
                                        <li key={i}>{p.productName} x{p.quantity}</li>
                                    ))}
                                </ul>
                            </div>
                            {order.shippoLabelUrl && (
                                <div className="mb-2">
                                    <a href={order.shippoLabelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download Shipping Label</a>
                                </div>
                            )}
                            {order.trackingNumber && (
                                <div className="mb-2">Tracking: {order.trackingNumber}</div>
                            )}
                            {order.payoutStatus === "available" && (
                                <button onClick={handleWithdraw} className="bg-green-600 text-white px-4 py-2 rounded">Withdraw</button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </StoreManagerTemplate>
    );
}