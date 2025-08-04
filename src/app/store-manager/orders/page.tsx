'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaDownload, FaShippingFast, FaEye, FaFilter, FaExternalLinkAlt } from "react-icons/fa";
import ProductQuickStartGuide, { TourStep } from "@/components/storeManagerHelpers/ProductQuickStartGuide";
import { OrderProduct } from "@/app/types/types";

// Define the types we need
type SortField = 'purchaseDate' | 'amount' | 'payoutStatus' | 'customerName' | 'products';
type SortDirection = 'asc' | 'desc';
type FirestoreTimestamp = { seconds: number; nanoseconds: number };

type PayoutStatus = 'pending' | 'paid' | 'withdrawn';

const orderTourSteps: TourStep[] = [
    {
        selector: '[data-tour="orders-filter"]',
        title: "Filter Orders",
        description: "Use these filters to find specific orders by status or search for orders by customer name or ID."
    },
    {
        selector: '[data-tour="orders-table"]',
        title: "View Your Orders",
        description: "Here you'll see all your orders with key information like status, amount, and customer details."
    },
    {
        selector: '[data-tour="order-actions"]',
        title: "Order Actions",
        description: "Click these buttons to process orders, print shipping labels, and manage fulfillment."
    }
];

interface ShippingAddress {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
}

interface FirestoreOrder extends Order {
    purchaseDate: FirestoreTimestamp;
    withdrawalPending?: boolean;
}

interface Order {
    id: string;
    customerEmail: string;
    shippingAddress: ShippingAddress;
    products: OrderProduct[];
    amount: number;
    subtotal: number;
    shippingCost: number;
    payoutStatus: PayoutStatus;
    trackingNumber?: string;
    shippoLabelUrl?: string;
    shippingStatus?: 'label_failed' | 'label_created' | 'shipped';
};

function OrdersContent() {
    const { user } = useUser();
    const [orders, setOrders] = useState<FirestoreOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [error, setError] = useState("");
    const [withdrawError, setWithdrawError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('purchaseDate');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<FirestoreOrder | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const showTour = searchParams.get('tour') === '1';

    // Prefetch next tour page if tour is active
    useEffect(() => {
        if (showTour) {
            router.prefetch && router.prefetch('/store-manager/payments?tour=1');
        }
    }, [showTour, router]);

    // When tour finishes, go to payments page with tour param
    const handleTourFinish = () => {
        router.push('/store-manager/payments?tour=1');
    };

    // Order-specific tour steps
    const orderTourSteps = [
        {
            selector: "[data-tour='orders-table']",
            title: "Orders Dashboard",
            description: "Here you can view and manage all your customer orders. Use filters to find specific orders and sort by different criteria."
        }
    ];

    // Fetch orders
    const fetchOrders = async () => {
        if (!user) return;
        setLoadingOrders(true);
        try {
            const response = await fetch(`/api/v1/vendor/orders?vendorId=${user.uid}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch orders');
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
            setError('Failed to fetch orders');
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user?.uid]);

    // Filtered and sorted orders
    const filteredOrders = useMemo(() => {
        let filtered = orders.filter(order => {
            const matchesSearch = searchTerm === "" ||
                (order.id && order.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                order.shippingAddress?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.products && order.products.some((p: any) => p.productName.toLowerCase().includes(searchTerm.toLowerCase())));
            const matchesStatus = statusFilter === 'all' || order.payoutStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            switch (sortField) {
                case 'purchaseDate':
                    aValue = typeof a.purchaseDate === 'object' ? a.purchaseDate.seconds : new Date(a.purchaseDate).getTime() / 1000;
                    bValue = typeof b.purchaseDate === 'object' ? b.purchaseDate.seconds : new Date(b.purchaseDate).getTime() / 1000;
                    break;
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'payoutStatus':
                    aValue = a.payoutStatus;
                    bValue = b.payoutStatus;
                    break;
                case 'customerName':
                    aValue = a.shippingAddress?.name || '';
                    bValue = b.shippingAddress?.name || '';
                    break;
                case 'products':
                    aValue = a.products?.length || 0;
                    bValue = b.products?.length || 0;
                    break;
                default:
                    return 0;
            }
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return filtered;
    }, [orders, searchTerm, sortField, sortDirection, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <FaSort className="w-3 h-3 text-gray-400" />;
        return sortDirection === 'asc' ? 
            <FaSortUp className="w-3 h-3 text-blue-600" /> : 
            <FaSortDown className="w-3 h-3 text-blue-600" />;
    };

    const formatDate = (date: Date | FirestoreTimestamp | string) => {
        if (!date) return 'N/A';
        const d = typeof date === 'object' && 'seconds' in date
            ? new Date(date.seconds * 1000)
            : new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeClass = (status: PayoutStatus) => {
        const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
        switch (status) {
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'paid':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'withdrawn':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const getStatusLabel = (status: PayoutStatus) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'paid':
                return 'Paid';
            case 'withdrawn':
                return 'Withdrawn';
            default:
                return 'Unknown';
        }
    };

    const canWithdraw = (order: FirestoreOrder) => {
        return order.payoutStatus === 'paid' && !order.withdrawalPending;
    };

    const handleIndividualWithdraw = async (orderId: string) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/vendor/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    vendorId: user.uid,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to process withdrawal');
            toast.success('Withdrawal processed successfully');
            fetchOrders(); // Refresh orders list
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            setWithdrawError('Failed to process withdrawal');
            toast.error('Failed to process withdrawal');
        } finally {
            setIsLoading(false);
        }
    };

    const retryShippingLabel = async (orderId: string | undefined) => {
        if (!orderId) return;
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/vendor/retry-shipping/${orderId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vendorId: user.uid,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to retry shipping label');
            toast.success('Shipping label retry requested');
            fetchOrders(); // Refresh orders list
        } catch (error) {
            console.error('Error retrying shipping label:', error);
            toast.error('Failed to retry shipping label');
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingOrders) {
        return (
            <StoreManagerTemplate>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </StoreManagerTemplate>
        );
    }

    if (error) {
        return (
            <StoreManagerTemplate>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800 font-medium">Error loading orders</div>
                    <div className="text-red-600 text-sm mt-1">{error}</div>
                </div>
            </StoreManagerTemplate>
        );
    }

    return (
        <StoreManagerTemplate>
            <div className="space-y-6">
                {/* Orders Table Section */}
                <div className="bg-white shadow-sm rounded-lg" data-tour="orders-table">
                    {/* Filter and Search Controls */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1" data-tour="orders-filter">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search orders..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                </div>

                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="pl-4 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Orders</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="withdrawn">Withdrawn</option>
                                    </select>
                                    <FaFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200" data-tour="order-table">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('purchaseDate')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Date</span>
                                            {getSortIcon('purchaseDate')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('customerName')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Customer</span>
                                            {getSortIcon('customerName')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('products')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Products</span>
                                            {getSortIcon('products')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('amount')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Amount</span>
                                            {getSortIcon('amount')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('payoutStatus')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Status</span>
                                            {getSortIcon('payoutStatus')}
                                        </div>
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(order.purchaseDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.shippingAddress?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.products?.length || 0} items
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${order.amount?.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={getStatusBadgeClass(order.payoutStatus)}>
                                                {getStatusLabel(order.payoutStatus)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Details Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4">
                            <div className="fixed inset-0 bg-black opacity-30"></div>
                            <div className="relative bg-white rounded-lg max-w-2xl w-full">
                                {/* Order Details Content */}
                                <div className="p-6" data-tour="order-details">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                        <button
                                            onClick={() => setSelectedOrder(null)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <span className="sr-only">Close</span>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Order Information */}
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Order ID</h3>
                                            <p className="mt-1 text-sm text-gray-900">{selectedOrder.id}</p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
                                            <div className="mt-1 text-sm text-gray-900">
                                                <p>{selectedOrder.shippingAddress?.name}</p>
                                                <p>{selectedOrder.customerEmail}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Shipping Address</h3>
                                            <div className="mt-1 text-sm text-gray-900">
                                                <p>{selectedOrder.shippingAddress?.address1}</p>
                                                {selectedOrder.shippingAddress?.address2 && (
                                                    <p>{selectedOrder.shippingAddress.address2}</p>
                                                )}
                                                <p>
                                                    {selectedOrder.shippingAddress?.city},{' '}
                                                    {selectedOrder.shippingAddress?.state}{' '}
                                                    {selectedOrder.shippingAddress?.zip}
                                                </p>
                                                <p>{selectedOrder.shippingAddress?.country}</p>
                                                {selectedOrder.shippingAddress?.phone && (
                                                    <p>Phone: {selectedOrder.shippingAddress.phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Products</h3>
                                            <div className="mt-2 space-y-2">
                                                {selectedOrder.products?.map((product: OrderProduct) => (
                                                    <div
                                                        key={`${product.productId}-${product.productName}`}
                                                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {product.productName}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                Quantity: {product.quantity}
                                                            </p>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            ${product.price.toFixed(2)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Order Totals */}
                                        <div className="mt-6 border-t pt-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Subtotal:</span>
                                                <span className="font-medium">
                                                    ${selectedOrder.subtotal?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Shipping:</span>
                                                <span className="font-medium">
                                                    ${selectedOrder.shippingCost?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-base font-bold pt-2 border-t">
                                                <span>Total:</span>
                                                <span>${selectedOrder.amount?.toFixed(2) || '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="bg-gray-50 p-4 rounded-lg mt-6" data-tour="order-actions">
                                        <h3 className="font-semibold mb-3 text-gray-900">Quick Actions</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedOrder.shippoLabelUrl && (
                                                <a
                                                    href={selectedOrder.shippoLabelUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                >
                                                    <FaDownload className="w-4 h-4" />
                                                    Download Shipping Label
                                                </a>
                                            )}
                                            
                                            {selectedOrder.trackingNumber && (
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(selectedOrder.trackingNumber!)}
                                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                                                >
                                                    <FaShippingFast className="w-4 h-4" />
                                                    Copy Tracking Number
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => navigator.clipboard.writeText(selectedOrder.customerEmail || '')}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                                disabled={!selectedOrder.customerEmail}
                                            >
                                                <FaEye className="w-4 h-4" />
                                                Copy Customer Email
                                            </button>
                                            
                                            {canWithdraw(selectedOrder) && selectedOrder.payoutStatus !== 'withdrawn' && (
                                                <button
                                                    onClick={() => selectedOrder.id && handleIndividualWithdraw(selectedOrder.id)}
                                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                                >
                                                    <FaDownload className="w-4 h-4" />
                                                    Withdraw Funds (${(selectedOrder.amount * 0.9).toFixed(2)})
                                                </button>
                                            )}
                                            
                                            {selectedOrder.shippingStatus === 'label_failed' && (
                                                <button
                                                    onClick={() => retryShippingLabel(selectedOrder.id)}
                                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                                                >
                                                    <FaShippingFast className="w-4 h-4" />
                                                    Retry Shipping Label
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={() => window.print()}
                                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                                            >
                                                <FaEye className="w-4 h-4" />
                                                Print Order Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showTour && (
                <ProductQuickStartGuide 
                    onClose={handleTourFinish}
                    steps={orderTourSteps}
                />
            )}
        </StoreManagerTemplate>
    );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greenPrimary"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <OrdersContent />
        </Suspense>
    );
}