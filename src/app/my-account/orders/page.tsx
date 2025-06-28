'use client';

import DashboardTemplate from "@/components/DashboradHelpers/DashboardTemplate";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaTruck, FaStore, FaReceipt } from "react-icons/fa";
import { FirestoreTimestamp } from "@/app/types/types";

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
    purchaseDate: FirestoreTimestamp;
    payoutStatus: string;
    shippingStatus?: string;
    trackingNumber?: string;
    shippoLabelUrl?: string;
    shippingCarrier?: string;
    shippingService?: string;
    estimatedDeliveryDate?: FirestoreTimestamp;
    shippingError?: string;
    shippingAddress: {
        name: string;
        street1: string;
        street2?: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        phone?: string;
    };
};

const formatDate = (date: Date | FirestoreTimestamp) => {
    if (date instanceof Date) {
        return date.toLocaleDateString();
    }
    return new Date(date.seconds * 1000).toLocaleDateString();
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
                                                {formatDate(order.purchaseDate)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">
                                                ${order.amount.toFixed(2)}
                                            </p>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                                    order.shippingStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    order.shippingStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                    order.shippingStatus === 'label_created' ? 'bg-purple-100 text-purple-800' :
                                                    order.shippingStatus === 'label_failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {order.shippingStatus === 'label_created' ? 'Label Created' :
                                                     order.shippingStatus === 'label_failed' ? 'Shipping Error' :
                                                     order.shippingStatus || 'Processing'}
                                                </span>
                                                {order.shippoLabelUrl && (
                                                    <span className="text-xs text-green-600 font-medium">📦 Ready to Ship</span>
                                                )}
                                            </div>
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

                                    {/* Shipping Information */}
                                    {(order.trackingNumber || order.shippoLabelUrl || order.shippingError) && (
                                        <div className={`border rounded-lg p-4 ${
                                            order.shippingError ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                                        }`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <FaTruck className={`w-4 h-4 ${order.shippingError ? 'text-red-600' : 'text-blue-600'}`} />
                                                    <span className={`font-medium ${order.shippingError ? 'text-red-900' : 'text-blue-900'}`}>
                                                        Shipping Information
                                                    </span>
                                                </div>
                                                {order.shippoLabelUrl && (
                                                    <div className="text-sm text-green-600 font-medium">
                                                        📦 Label Created - Vendor will ship soon
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {order.shippingError ? (
                                                <div className="text-red-800 text-sm bg-red-100 p-2 rounded">
                                                    <strong>⚠️ Shipping Label Error:</strong> {order.shippingError}
                                                    <br />
                                                    <span className="text-xs">Please contact the vendor for assistance.</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {/* Shipping Details */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                        {order.shippingCarrier && (
                                                            <div>
                                                                <span className="text-blue-700 font-medium">Carrier:</span>
                                                                <span className="ml-2 text-blue-800">{order.shippingCarrier}</span>
                                                            </div>
                                                        )}
                                                        {order.shippingService && (
                                                            <div>
                                                                <span className="text-blue-700 font-medium">Service:</span>
                                                                <span className="ml-2 text-blue-800">{order.shippingService}</span>
                                                            </div>
                                                        )}
                                                        {order.estimatedDeliveryDate && (
                                                            <div className="md:col-span-2">
                                                                <span className="text-blue-700 font-medium">Estimated Delivery:</span>
                                                                <span className="ml-2 text-blue-800">
                                                                    {new Date(order.estimatedDeliveryDate.seconds * 1000).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Tracking Number */}
                                                    {order.trackingNumber && (
                                                        <div>
                                                            <p className="text-blue-800 text-sm mb-1 font-medium">
                                                                Tracking Number:
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-blue-800 font-mono text-sm bg-white px-3 py-2 rounded border flex-1">
                                                                    {order.trackingNumber}
                                                                </p>
                                                                <button
                                                                    onClick={() => navigator.clipboard.writeText(order.trackingNumber!)}
                                                                    className="bg-blue-100 text-blue-600 hover:bg-blue-200 px-2 py-2 rounded text-xs transition-colors"
                                                                    title="Copy tracking number"
                                                                >
                                                                    Copy
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Shipping Status Info */}
                                                    {order.shippoLabelUrl && (
                                                        <div className="text-xs text-blue-700 bg-blue-100 p-3 rounded">
                                                            <div className="flex items-start gap-2">
                                                                <span>📦</span>
                                                                <div>
                                                                    <strong>Your Order is Being Prepared:</strong>
                                                                    <br />
                                                                    • The vendor has created a shipping label
                                                                    <br />
                                                                    • Your package will be shipped soon
                                                                    <br />
                                                                    • You'll receive tracking updates once it's in transit
                                                                    <br />
                                                                    • Contact the vendor if you have questions about shipping
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
