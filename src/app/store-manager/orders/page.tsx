'use client';

import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState, useMemo } from "react";
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaDownload, FaShippingFast, FaEye, FaFilter, FaExternalLinkAlt } from "react-icons/fa";

type Order = {
    id: string;
    vendorId: string;
    vendorName: string;
    purchaseDate: { seconds: number } | string;
    amount: number;
    subtotal?: number;
    shippingCost?: number;
    payoutStatus: 'available' | 'pending' | 'paid';
    products: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
    shippoLabelUrl?: string;
    trackingNumber?: string;
    customerId: string;
    customerEmail?: string;
    shippingAddress: {
        name: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    refundStatus: string;
    currency: string;
    withdrawAvailableDate?: { seconds: number };
    shippingStatus?: string;
};

type SortField = 'purchaseDate' | 'amount' | 'payoutStatus' | 'customerName' | 'products';
type SortDirection = 'asc' | 'desc';

export default function Page() {
    const { user } = useUser();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Table state
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>('purchaseDate');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/v1/vendor/orders?vendorId=${user.uid}`);
                const data = await res.json();
                setOrders(data.orders || []);
            } catch (err) {
                setError("Failed to fetch orders");
            }
            setLoading(false);
        };
        fetchOrders();
    }, [user]);

    // Filtered and sorted orders
    const filteredOrders = useMemo(() => {
        let filtered = orders.filter(order => {
            const matchesSearch = searchTerm === "" || 
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            available: 'bg-green-100 text-green-800 border-green-200',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            paid: 'bg-blue-100 text-blue-800 border-blue-200',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatDate = (date: { seconds: number } | string) => {
        const d = typeof date === 'object' ? new Date(date.seconds * 1000) : new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleWithdraw = async () => {
        if (!user) return;
        await fetch(`/api/v1/vendor/withdraw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vendorId: user.uid }),
        });
    };

    if (loading) {
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
                                                {order.products.slice(0, 2).map((product, i) => (
                                                    <div key={i} className="flex justify-between">
                                                        <span className="truncate max-w-32">{product.productName}</span>
                                                        <span className="text-gray-500">×{product.quantity}</span>
                                                    </div>
                                                ))}
                                                {order.products.length > 2 && (
                                                    <div className="text-xs text-gray-500">
                                                        +{order.products.length - 2} more
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
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(order.payoutStatus)}`}>
                                                {order.payoutStatus}
                                            </span>
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
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Order Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div><strong>Order ID:</strong> {selectedOrder.id}</div>
                                        <div><strong>Date:</strong> {formatDate(selectedOrder.purchaseDate)}</div>
                                        <div><strong>Status:</strong> 
                                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedOrder.payoutStatus)}`}>
                                                {selectedOrder.payoutStatus}
                                            </span>
                                        </div>
                                        {selectedOrder.trackingNumber && (
                                            <div><strong>Tracking:</strong> {selectedOrder.trackingNumber}</div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Customer Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div><strong>Name:</strong> {selectedOrder.shippingAddress.name || 'N/A'}</div>
                                        <div><strong>Email:</strong> {selectedOrder.customerEmail || 'N/A'}</div>
                                        <div>
                                            <strong>Shipping Address:</strong>
                                            <div className="mt-1 text-gray-600">
                                                {selectedOrder.shippingAddress.name}<br/>
                                                {selectedOrder.shippingAddress.street}<br/>
                                                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zip}<br/>
                                                {selectedOrder.shippingAddress.country}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products */}
                            <div>
                                <h3 className="font-semibold mb-2">Products</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left py-2 px-3 text-sm font-medium">Product</th>
                                                <th className="text-left py-2 px-3 text-sm font-medium">Quantity</th>
                                                <th className="text-left py-2 px-3 text-sm font-medium">Price</th>
                                                <th className="text-left py-2 px-3 text-sm font-medium">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedOrder.products.map((product, i) => (
                                                <tr key={i}>
                                                    <td className="py-2 px-3 text-sm">{product.productName}</td>
                                                    <td className="py-2 px-3 text-sm">{product.quantity}</td>
                                                    <td className="py-2 px-3 text-sm">${product.price.toFixed(2)}</td>
                                                    <td className="py-2 px-3 text-sm">${(product.price * product.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Order Totals */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Order Totals</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>${selectedOrder.subtotal?.toFixed(2) || selectedOrder.amount.toFixed(2)}</span>
                                    </div>
                                    {selectedOrder.shippingCost && (
                                        <div className="flex justify-between">
                                            <span>Shipping:</span>
                                            <span>${selectedOrder.shippingCost.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-semibold border-t border-gray-300 pt-1">
                                        <span>Total:</span>
                                        <span>${selectedOrder.amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
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

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </StoreManagerTemplate>
    );
}