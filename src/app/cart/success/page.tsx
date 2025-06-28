'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FaCheckCircle, FaTruck, FaReceipt, FaStore } from 'react-icons/fa';

type OrderSummary = {
    sessionId: string;
    totalAmount: number;
    currency: string;
    customerEmail: string;
    paymentStatus: string;
    orders: Array<{
        vendorId: string;
        vendorName: string;
        subtotal: number;
        shippingCost: number;
        total: number;
        products: Array<{
            name: string;
            quantity: number;
            price: number;
        }>;
    }>;
};

function CartSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (!sessionId) {
            setError('No session ID provided');
            setLoading(false);
            return;
        }

        const fetchOrderSummary = async () => {
            try {
                const response = await fetch(`/api/v1/checkout/session?session_id=${sessionId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch order details');
                }

                const data = await response.json();
                setOrderSummary(data);
            } catch (err) {
                console.error('Error fetching order summary:', err);
                setError('Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderSummary();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your order details...</p>
                </div>
            </div>
        );
    }

    if (error || !orderSummary) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Details Unavailable</h1>
                    <p className="text-gray-600 mb-6">{error || 'Unable to load order information'}</p>
                    <Link 
                        href="/shop"
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    const grandTotal = orderSummary.orders.reduce((sum, order) => sum + order.total, 0);

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                        <FaCheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Thank you for your purchase. Your order has been successfully processed.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
                        <p className="text-sm text-green-800">
                            <strong>Order ID:</strong> {orderSummary.sessionId.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-green-800">
                            <strong>Email:</strong> {orderSummary.customerEmail || session?.user?.email || 'Not provided'}
                        </p>
                    </div>
                </div>

                {/* Order Summary Cards */}
                <div className="space-y-6 mb-8">
                    {orderSummary.orders.map((order, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Vendor Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b">
                                <div className="flex items-center gap-3">
                                    <FaStore className="w-5 h-5 text-green-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">{order.vendorName}</h3>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="p-6">
                                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <FaReceipt className="w-4 h-4" />
                                    Items Ordered
                                </h4>
                                <div className="space-y-3 mb-6">
                                    {order.products.map((product, productIndex) => (
                                        <div key={productIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                            <div>
                                                <p className="font-medium text-gray-900">{product.name}</p>
                                                <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                ${(product.price * product.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Totals */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className="text-gray-900">${order.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 flex items-center gap-1">
                                                <FaTruck className="w-3 h-3" />
                                                Shipping:
                                            </span>
                                            <span className="text-gray-900">${order.shippingCost.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-2">
                                            <div className="flex justify-between font-semibold">
                                                <span className="text-gray-900">Total:</span>
                                                <span className="text-gray-900">${order.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grand Total */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Order Total</h3>
                        <p className="text-3xl font-bold text-green-600">${grandTotal.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 mt-2">
                            Payment Status: <span className="font-medium text-green-600">Paid</span>
                        </p>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">What happens next?</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-blue-600 text-sm font-bold">1</span>
                            </div>
                            <div>
                                <p className="font-medium text-blue-900">Order Processing</p>
                                <p className="text-sm text-blue-700">Your vendors will prepare your items for shipment.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-blue-600 text-sm font-bold">2</span>
                            </div>
                            <div>
                                <p className="font-medium text-blue-900">Shipping Labels</p>
                                <p className="text-sm text-blue-700">Shipping labels will be generated and tracking information will be provided.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-blue-600 text-sm font-bold">3</span>
                            </div>
                            <div>
                                <p className="font-medium text-blue-900">Email Updates</p>
                                <p className="text-sm text-blue-700">You'll receive tracking information via email once items ship.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                        href="/my-account/orders"
                        className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                    >
                        View My Orders
                    </Link>
                    <Link 
                        href="/shop"
                        className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CartSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your order details...</p>
            </div>
        </div>}>
            <CartSuccessContent />
        </Suspense>
    );
} 