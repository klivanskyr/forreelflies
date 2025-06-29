'use client';

import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState, useMemo } from "react";
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaDownload, FaShippingFast, FaEye, FaFilter, FaExternalLinkAlt } from "react-icons/fa";
import { Order } from "@/app/types/types";
import toast from "react-hot-toast";

type SortField = 'purchaseDate' | 'amount' | 'payoutStatus' | 'customerName' | 'products';
type SortDirection = 'asc' | 'desc';

type FirestoreTimestamp = {
    seconds: number;
    nanoseconds: number;
};

type FirestoreOrder = Omit<Order, 'purchaseDate' | 'withdrawAvailableDate' | 'estimatedDeliveryDate'> & {
    purchaseDate: FirestoreTimestamp;
    withdrawAvailableDate: FirestoreTimestamp;
    estimatedDeliveryDate?: FirestoreTimestamp;
};

export default function Page() {
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

    // Move fetchOrders outside of useEffect for reusability
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
    }, [user]);

    // Filtered and sorted orders
    const filteredOrders = useMemo(() => {
        let filtered = orders.filter(order => {
            const matchesSearch = searchTerm === "" ||
                (order.id && order.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                order.shippingAddress.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.products.some(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = statusFilter === 'all' || order.payoutStatus === statusFilter;
            
            return matchesSearch && matchesStatus;
        });

        // Sort orders
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
                    aValue = a.shippingAddress.name || '';
                    bValue = b.shippingAddress.name || '';
                    break;
                case 'products':
                    aValue = a.products.length;
                    bValue = b.products.length;
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

    const getStatusBadge = (status: string) => {
        const styles = {
            available: 'bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center justify-center',
            pending_delivery: 'bg-amber-50 text-amber-700 border-amber-200 flex items-center justify-center',
            pending_holdback: 'bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center justify-center',
            pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center justify-center',
            paid: 'bg-sky-50 text-sky-700 border-sky-200 flex items-center justify-center',
            withdrawn: 'bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center justify-center',
            admin_approved: 'bg-green-50 text-green-700 border-green-200 flex items-center justify-center',
            blocked: 'bg-red-50 text-red-700 border-red-200 flex items-center justify-center',
            refunded: 'bg-slate-50 text-slate-700 border-slate-200 flex items-center justify-center'
        };
        return `px-2 py-1 rounded-full text-xs border ${styles[status as keyof typeof styles] || styles.pending}`;
    };

    const formatDate = (timestamp: FirestoreTimestamp | undefined) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    };

    const handleWithdraw = async () => {
        if (!user) {
            toast.error("User not authenticated");
            return;
        }
        
        try {
            setIsLoading(true);
            // Filter orders that are actually available for withdrawal
            const eligibleOrders = orders.filter(order => {
                const withdrawStatus = getWithdrawStatus(order);
                return withdrawStatus.canWithdraw && canWithdraw(order);
            });

            if (eligibleOrders.length === 0) {
                toast.error("No eligible orders found for withdrawal");
                setIsLoading(false);
                return;
            }

            // Process each eligible order
            const results = await Promise.all(
                eligibleOrders.map(async (order) => {
                    try {
                        const response = await fetch('/api/v1/vendor/withdraw-order', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ 
                                vendorId: user.uid,
                                orderId: order.id,
                                isAdminApproved: order.payoutStatus === 'admin_approved'
                            }),
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to withdraw funds');
                        }

                        return { orderId: order.id, success: true };
                    } catch (error) {
                        return { 
                            orderId: order.id, 
                            success: false, 
                            error: error instanceof Error ? error.message : 'Failed to withdraw funds' 
                        };
                    }
                })
            );

            // Count successes and failures
            const successCount = results.filter(r => r.success).length;
            const failureCount = results.filter(r => !r.success).length;

            // Show appropriate toast messages
            if (successCount > 0) {
                toast.success(`Successfully withdrew funds from ${successCount} order${successCount > 1 ? 's' : ''}`);
            }
            if (failureCount > 0) {
                toast.error(`Failed to withdraw funds from ${failureCount} order${failureCount > 1 ? 's' : ''}`);
            }

            // Refresh orders list
            await fetchOrders();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to withdraw funds');
        } finally {
            setIsLoading(false);
        }
    };

    const handleIndividualWithdraw = async (orderId: string | undefined) => {
        if (!user || !orderId) return;
        
        // Find the order to check if it's actually withdrawable
        const orderToWithdraw = orders.find(o => o.id === orderId);
        console.log('Found order to withdraw:', orderToWithdraw);
        
        if (!orderToWithdraw) {
            console.error('Order not found');
            setWithdrawError("Order not found");
            return;
        }

        const canWithdrawOrder = canWithdraw(orderToWithdraw);
        console.log('Can withdraw order?', canWithdrawOrder);

        if (!canWithdrawOrder) {
            setWithdrawError("Order is not available for withdrawal");
            return;
        }

        setWithdrawError(null);
        try {
            setIsLoading(true);
            console.log('Sending withdrawal request for order:', {
                orderId,
                vendorId: user.uid,
                isAdminApproved: orderToWithdraw.payoutStatus === 'admin_approved'
            });

            const response = await fetch(`/api/v1/vendor/withdraw-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    vendorId: user.uid,
                    orderId,
                    isAdminApproved: orderToWithdraw.payoutStatus === 'admin_approved'
                }),
            });
            
            const data = await response.json();
            console.log('Withdrawal response:', data);

            if (!response.ok) {
                console.error('Withdrawal failed:', data);
                setWithdrawError(data.error || "Failed to process withdrawal");
                return;
            }

            // Close the modal first
            setSelectedOrder(null);
            
            // Show success toast
            toast.success("Successfully withdrew funds");

            // Refresh orders to update the status
            await fetchOrders();
        } catch (error) {
            console.error('Withdrawal error:', error);
            setWithdrawError("Failed to process withdrawal. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const getDaysUntilWithdraw = (order: FirestoreOrder) => {
        if (order.shippingStatus !== 'delivered') {
            return -1; // Special value to indicate order not delivered
        }
        const withdrawDate = typeof order.withdrawAvailableDate === 'object' 
            ? new Date(order.withdrawAvailableDate.seconds * 1000)
            : new Date(order.withdrawAvailableDate || '');
        const now = new Date();
        const diffTime = withdrawDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const getWithdrawStatus = (order: FirestoreOrder) => {
        // If admin approved, allow immediate withdrawal
        if (order.payoutStatus === 'admin_approved') {
            return {
                canWithdraw: true,
                message: "Approved for immediate withdrawal",
                color: "text-green-600"
            };
        }

        // If already withdrawn, show that status
        if (order.payoutStatus === 'withdrawn') {
            return {
                canWithdraw: false,
                message: "Already withdrawn",
                color: "text-gray-600"
            };
        }

        // If not delivered, can't withdraw
        if (order.shippingStatus !== 'delivered') {
            return {
                canWithdraw: false,
                message: "Order must be delivered before withdrawal",
                color: "text-gray-600"
            };
        }

        // Check if 30 days have passed since purchase date
        const purchaseDate = new Date(order.purchaseDate.seconds * 1000);
        const now = new Date();
        const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSincePurchase >= 30) {
            return {
                canWithdraw: true,
                message: "Available for withdrawal (30 days passed)",
                color: "text-green-600"
            };
        }

        // If none of the above conditions are met, show days remaining
        const daysRemaining = 30 - daysSincePurchase;
        return {
            canWithdraw: false,
            message: `Available in ${daysRemaining} days`,
            color: "text-yellow-600"
        };
    };

    const canWithdraw = (order: FirestoreOrder) => {
        console.log('Checking withdrawal eligibility for order:', {
            id: order.id,
            payoutStatus: order.payoutStatus,
            shippingStatus: order.shippingStatus
        });

        // Admin approved orders can be withdrawn immediately
        if (order.payoutStatus === 'admin_approved') {
            console.log('Order is admin approved - allowing withdrawal');
            return true;
        }

        // Already withdrawn orders can't be withdrawn again
        if (order.payoutStatus === 'withdrawn') {
            console.log('Order already withdrawn - blocking withdrawal');
            return false;
        }

        // Order must be delivered
        if (order.shippingStatus !== 'delivered') {
            console.log('Order not delivered - blocking withdrawal');
            return false;
        }

        // Check if 30 days have passed since purchase
        const purchaseDate = new Date(order.purchaseDate.seconds * 1000);
        const now = new Date();
        const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log('Days since purchase:', daysSincePurchase);
        return daysSincePurchase >= 30;
    };

    const retryShippingLabel = async (orderId: string | undefined) => {
        if (!orderId) return;
        try {
            const response = await fetch(`/api/v1/shipping/retry-label`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });

            if (response.ok) {
                // Refresh orders to update the status
                const res = await fetch(`/api/v1/vendor/orders?vendorId=${user?.uid}`);
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Failed to retry shipping label:', error);
        }
    };

    const getShippingStatusBadge = (status: Order['shippingStatus']) => {
        switch (status) {
            case 'shipped':
                return 'bg-green-100 text-green-800';
            case 'delivered':
                return 'bg-blue-100 text-blue-800';
            case 'label_failed':
                return 'bg-red-100 text-red-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
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
                {/* Error Popup */}
                {withdrawError && (
                    <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Withdrawal Error</h3>
                                    <div className="mt-1 text-sm text-red-700">{withdrawError}</div>
                                </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <button
                                    onClick={() => setWithdrawError(null)}
                                    className="inline-flex text-gray-400 hover:text-gray-500"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                        <p className="text-gray-600 mt-1">Manage and track your orders with shipping labels</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                            Total Orders: <span className="font-semibold">{filteredOrders.length}</span>
                        </div>
                        <button 
                            onClick={handleWithdraw}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <FaDownload className="w-4 h-4" />
                            Withdraw Available Funds
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search orders, customers, products, tracking..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <FaFilter className="text-gray-400 w-4 h-4" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="available">Available</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="withdrawn">Withdrawn</option>
                            </select>
                        </div>

                        {/* Items per page */}
                        <div className="text-sm text-gray-600">
                            Showing {paginatedOrders.length} of {filteredOrders.length} orders
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        <button
                                            onClick={() => handleSort('purchaseDate')}
                                            className="flex items-center gap-2 hover:text-blue-600"
                                        >
                                            Date {getSortIcon('purchaseDate')}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Order ID</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        <button
                                            onClick={() => handleSort('customerName')}
                                            className="flex items-center gap-2 hover:text-blue-600"
                                        >
                                            Customer {getSortIcon('customerName')}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        <button
                                            onClick={() => handleSort('products')}
                                            className="flex items-center gap-2 hover:text-blue-600"
                                        >
                                            Products {getSortIcon('products')}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        <button
                                            onClick={() => handleSort('amount')}
                                            className="flex items-center gap-2 hover:text-blue-600"
                                        >
                                            Total {getSortIcon('amount')}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                                        <button
                                            onClick={() => handleSort('payoutStatus')}
                                            className="flex items-center gap-2 hover:text-blue-600"
                                        >
                                            Status {getSortIcon('payoutStatus')}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Shipping</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-900">
                                            {formatDate(order.purchaseDate)}
                                        </td>
                                                                <td className="py-3 px-4 text-sm font-mono text-gray-900">
                            <div className="max-w-32 truncate" title={order.id}>
                                {order.id}
                            </div>
                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900">
                                            <div>
                                                <div className="font-medium">{order.shippingAddress.name || 'N/A'}</div>
                                                <div className="text-gray-500 text-xs">{order.customerEmail}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900">
                                            <div className="space-y-1">
                                                {order.products?.slice(0, 2).map((product, i) => (
                                                    <div key={i} className="flex justify-between">
                                                        <span className="truncate max-w-32">{product.productName}</span>
                                                        <span className="text-gray-500">×{product.quantity}</span>
                                                    </div>
                                                ))}
                                                {order.products && order.products.length > 2 && (
                                                    <div className="text-xs text-gray-500">
                                                        +{order.products.length - 2} more
                                                    </div>
                                                )}
                                                {!order.products && (
                                                    <div className="text-xs text-gray-500">
                                                        No products found
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-900">
                                            <div>
                                                <div className="font-medium">${order.amount.toFixed(2)}</div>
                                                {order.subtotal && order.shippingCost && (
                                                    <div className="text-xs text-gray-500">
                                                        ${order.subtotal.toFixed(2)} + ${order.shippingCost.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(order.payoutStatus)}`}>
                                                    {order.payoutStatus}
                                                </span>
                                                <span className={`text-xs ${getWithdrawStatus(order).color}`}>
                                                    {getWithdrawStatus(order).message}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                {order.trackingNumber && (
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <FaShippingFast className="w-3 h-3 text-blue-600" />
                                                        <span className="font-mono">{order.trackingNumber}</span>
                                                    </div>
                                                )}
                                                {order.shippoLabelUrl && (
                                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                                        <FaDownload className="w-3 h-3" />
                                                        Label Ready
                                                    </div>
                                                )}
                                                {!order.trackingNumber && !order.shippoLabelUrl && (
                                                    <span className="text-xs text-gray-400">No shipping info</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="View Details"
                                                >
                                                    <FaEye className="w-4 h-4" />
                                                </button>
                                                {order.shippoLabelUrl && (
                                                    <a
                                                        href={order.shippoLabelUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 hover:text-green-800 p-1"
                                                        title="Download Shipping Label"
                                                    >
                                                        <FaDownload className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {filteredOrders.length === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <div className="text-gray-400 text-6xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                        <p className="text-gray-600">
                            {searchTerm || statusFilter !== 'all' 
                                ? "Try adjusting your search or filters" 
                                : "Orders will appear here once customers make purchases"}
                        </p>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Order Details</h2>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Order Overview */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-blue-900">Order #{selectedOrder.id ? selectedOrder.id.substring(0, 8) : 'N/A'}...</h3>
                                        <p className="text-blue-700 text-sm">Placed on {formatDate(selectedOrder.purchaseDate)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-900">
                                            ${selectedOrder.amount?.toFixed(2) || '0.00'}
                                        </div>
                                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedOrder.payoutStatus || 'pending')}`}>
                                            {(selectedOrder.payoutStatus || 'pending').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Order Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Order Details
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Order ID:</span>
                                            <span className="font-mono text-gray-900">{selectedOrder.id || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Customer ID:</span>
                                            <span className="font-mono text-gray-900">{selectedOrder.customerId || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Currency:</span>
                                            <span className="uppercase font-medium">{selectedOrder.currency || 'USD'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Items Count:</span>
                                            <span className="font-medium">
                                                {selectedOrder.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0}
                                            </span>
                                        </div>
                                        {selectedOrder.refundStatus && selectedOrder.refundStatus !== 'none' && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Refund Status:</span>
                                                <span className="font-medium text-red-600">{selectedOrder.refundStatus}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Customer Info
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-gray-600 block">Name:</span>
                                            <span className="font-medium">{selectedOrder.shippingAddress?.name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block">Address:</span>
                                            <span className="font-medium">
                                                {selectedOrder.shippingAddress?.address1 || 'N/A'}
                                                {selectedOrder.shippingAddress?.address2 && `, ${selectedOrder.shippingAddress.address2}`}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block">City, State, ZIP:</span>
                                            <span className="font-medium">
                                                {[
                                                    selectedOrder.shippingAddress?.city,
                                                    selectedOrder.shippingAddress?.state,
                                                    selectedOrder.shippingAddress?.zip
                                                ].filter(Boolean).join(', ') || 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block">Country:</span>
                                            <span className="font-medium">{selectedOrder.shippingAddress?.country || 'N/A'}</span>
                                        </div>
                                        {selectedOrder.shippingAddress?.phone && (
                                            <div>
                                                <span className="text-gray-600 block">Phone:</span>
                                                <span className="font-medium">{selectedOrder.shippingAddress.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        Fulfillment
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Shipping Status:</span>
                                            <span className={`font-medium ${getShippingStatusBadge(selectedOrder.shippingStatus)}`}>
                                                {selectedOrder.shippingStatus || 'Not Set'}
                                            </span>
                                        </div>
                                        {selectedOrder.trackingNumber && (
                                            <div>
                                                <span className="text-gray-600 block">Tracking Number:</span>
                                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                                    {selectedOrder.trackingNumber}
                                                </span>
                                            </div>
                                        )}
                                        {selectedOrder.shippoLabelUrl && (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <FaDownload className="w-3 h-3" />
                                                <span className="text-xs">Shipping Label Available</span>
                                            </div>
                                        )}
                                        {!selectedOrder.trackingNumber && !selectedOrder.shippoLabelUrl && (
                                            <div className="text-gray-500 text-xs">No shipping information available</div>
                                        )}
                                        {selectedOrder.shippingStatus === 'label_failed' && (
                                            <div className="text-red-600 text-xs">⚠️ Shipping Label Error</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Financial Information */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    Financial Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Payout Information</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Payout Status:</span>
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedOrder.payoutStatus || 'pending')}`}>
                                                    {selectedOrder.payoutStatus || 'pending'}
                                                </span>
                                            </div>
                                            {selectedOrder.withdrawAvailableDate && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Available Date:</span>
                                                    <span className="font-medium">
                                                        {formatDate(selectedOrder.withdrawAvailableDate)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Days Until Withdraw:</span>
                                                <span className={`font-medium ${getWithdrawStatus(selectedOrder).color}`}>
                                                    {getWithdrawStatus(selectedOrder).message}
                                                </span>
                                            </div>
                                            {selectedOrder.stripeTransferId && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Transfer ID:</span>
                                                    <span className="font-mono text-xs">{selectedOrder.stripeTransferId}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Amount Breakdown</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Subtotal:</span>
                                                <span className="font-medium">${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Shipping:</span>
                                                <span className="font-medium">${selectedOrder.shippingCost?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between text-base font-bold pt-2 border-t">
                                                <span>Total:</span>
                                                <span>${selectedOrder.amount?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>Platform Fee (10% of product amount):</span>
                                                <span>-${selectedOrder.platformFee?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-medium text-green-600 border-t border-gray-200 pt-1">
                                                <span>Your Earnings (90% of products + shipping):</span>
                                                <span>${selectedOrder.vendorEarnings?.toFixed(2) || '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Products Ordered ({selectedOrder.products?.length || 0} items)
                                </h3>
                                <div className="space-y-4">
                                    {selectedOrder.products?.map((product, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
                                            {product.productImage ? (
                                                <img
                                                    src={product.productImage}
                                                    alt={product.productName}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                                    <span className="text-gray-400">No image</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{product.productName}</h4>
                                                <div className="text-sm text-gray-500">
                                                    Quantity: {product.quantity || 0} × ${product.price?.toFixed(2) || '0.00'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-gray-900">
                                                    ${((product.quantity || 0) * (product.price || 0)).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Order Totals */}
                                <div className="mt-6 border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Shipping:</span>
                                        <span className="font-medium">${selectedOrder.shippingCost?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold pt-2 border-t">
                                        <span>Total:</span>
                                        <span>${selectedOrder.amount?.toFixed(2) || '0.00'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-gray-50 p-4 rounded-lg">
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
            )}
        </StoreManagerTemplate>
    );
}