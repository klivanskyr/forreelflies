'use client';

import DashboardTemplate from "@/components/DashboradHelpers/DashboardTemplate";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaTruck, FaStore, FaReceipt } from "react-icons/fa";

type Order = {
    id: string;
    vendorId: string;
    vendorName: string;
    products: Array<{
        productId: string;
        productName: string;
        productImage?: string;
        quantity: number;
        price: number;
    }>;
    subtotal: number;
    shippingCost: number;
    amount: number;
    currency: string;
    purchaseDate: { seconds: number };
    payoutStatus: string;
    shippingStatus?: string;
    trackingNumber?: string;
    shippingAddress: {
        name: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
};

export default function Page() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            if (!session?.user?.uid) return;
            
            setLoading(true);
            setError("");
            
            try {
                // This endpoint doesn't exist yet - would need to create it
                // For now, we'll show a placeholder
                const res = await fetch(`/api/v1/user/orders?userId=${session.user.uid}`);
                
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders || []);
                } else {
                    setError("Failed to fetch orders");
                }
            } catch (err) {
                setError("Failed to fetch orders");
                console.error("Error fetching orders:", err);
            }
            
            setLoading(false);
        };

        fetchOrders();
    }, [session]);

    return (
        <DashboardTemplate>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
                        <p className="text-gray-600 mb-6">
                            We're having trouble loading your orders right now.
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
                        <p className="text-gray-600 mb-6">
                            You haven't placed any orders yet. Start shopping to see your orders here!
                        </p>
                        <Link 
                            href="/shop"
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                {/* Order Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Order #{order.id.slice(-8).toUpperCase()}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {new Date(order.purchaseDate.seconds * 1000).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">
                                                ${order.amount.toFixed(2)}
                                            </p>
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                                order.shippingStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                                order.shippingStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {order.shippingStatus || 'Processing'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Content */}
                                <div className="p-6">
                                    {/* Vendor Info */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <FaStore className="w-5 h-5 text-green-600" />
                                        <span className="font-medium text-gray-900">{order.vendorName}</span>
                                        <Link 
                                            href={`/vendor/${order.vendorId}`}
                                            className="text-green-600 hover:text-green-700 text-sm"
                                        >
                                            Visit Store
                                        </Link>
                                    </div>

                                    {/* Products */}
                                    <div className="mb-6">
                                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                            <FaReceipt className="w-4 h-4" />
                                            Items
                                        </h4>
                                        <div className="space-y-3">
                                            {order.products.map((product, index) => (
                                                <div key={index} className="flex justify-between items-center py-2">
                                                    <div className="flex items-center gap-3">
                                                        {product.productImage && (
                                                            <img 
                                                                src={product.productImage} 
                                                                alt={product.productName}
                                                                className="w-12 h-12 object-cover rounded"
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {product.productName}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Qty: {product.quantity} × ${product.price.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="font-medium text-gray-900">
                                                        ${(product.price * product.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Totals */}
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Subtotal:</span>
                                                <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 flex items-center gap-1">
                                                    <FaTruck className="w-3 h-3" />
                                                    Shipping:
                                                </span>
                                                <span className="text-gray-900">${order.shippingCost.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-gray-200 pt-2">
                                                <div className="flex justify-between font-semibold">
                                                    <span className="text-gray-900">Total:</span>
                                                    <span className="text-gray-900">${order.amount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tracking Info */}
                                    {order.trackingNumber && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaTruck className="w-4 h-4 text-blue-600" />
                                                <span className="font-medium text-blue-900">Tracking Information</span>
                                            </div>
                                            <p className="text-blue-800 font-mono text-sm">
                                                {order.trackingNumber}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardTemplate>
    );
}
