'use client';

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import ProductQuickStartGuide from "@/components/storeManagerHelpers/ProductQuickStartGuide";
import { useUser } from "@/contexts/UserContext";
import { useVendor } from "@/hooks/useVendor";
import { toast } from "sonner";
import { FaDollarSign, FaCreditCard, FaClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

interface Transaction {
    id: string;
    date: Date;
    type: string;
    amount: number;
    status: string;
    customerEmail: string;
    method: string;
    metadata: {
        products: any[];
        shippingStatus: string;
        transferId?: string;
    };
}

interface Summary {
    totalEarnings: number;
    withdrawn: number;
    available: number;
    pending: number;
}

function PaymentsContent() {
    const { user } = useUser();
    const { vendor, loading: vendorLoading } = useVendor();
    const router = useRouter();
    const searchParams = useSearchParams();
    const showTour = searchParams.get('tour') === '1';
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<Summary>({
        totalEarnings: 0,
        withdrawn: 0,
        available: 0,
        pending: 0
    });
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    
    // Add tour step handling
    const handleTourFinish = () => {
        router.push('/store-manager/products?tour=1');
    };

    // Prefetch next tour page
    useEffect(() => {
        if (showTour) {
            router.prefetch && router.prefetch('/store-manager/products?tour=1');
        }
    }, [showTour, router]);

    // Fetch transactions data
    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user?.uid) return;
            
            setLoading(true);
            try {
                const response = await fetch(`/api/v1/vendor/transactions?vendorId=${user.uid}&period=${selectedPeriod}`);
                if (response.ok) {
                    const data = await response.json();
                    setTransactions(data.transactions || []);
                    setSummary(data.summary || {
                        totalEarnings: 0,
                        withdrawn: 0,
                        available: 0,
                        pending: 0
                    });
                } else {
                    console.error('Failed to fetch transactions');
                    toast.error('Failed to load payment data');
                }
            } catch (error) {
                console.error('Error fetching transactions:', error);
                toast.error('Failed to load payment data');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [user?.uid, selectedPeriod]);

    const handleWithdraw = async () => {
        if (!user?.uid) return;
        
        setWithdrawLoading(true);
        try {
            const response = await fetch('/api/v1/vendor/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vendorId: user.uid }),
            });

            if (response.ok) {
                toast.success('Withdrawal processed successfully!');
                // Refresh transactions
                const transactionsResponse = await fetch(`/api/v1/vendor/transactions?vendorId=${user.uid}&period=${selectedPeriod}`);
                if (transactionsResponse.ok) {
                    const data = await transactionsResponse.json();
                    setTransactions(data.transactions || []);
                    setSummary(data.summary || summary);
                }
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to process withdrawal');
            }
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            toast.error('Failed to process withdrawal');
        } finally {
            setWithdrawLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(date));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'withdrawn':
                return 'text-green-600 bg-green-100';
            case 'available':
                return 'text-blue-600 bg-blue-100';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'withdrawn':
                return <FaCheckCircle className="w-4 h-4" />;
            case 'available':
                return <FaCreditCard className="w-4 h-4" />;
            case 'pending':
                return <FaClock className="w-4 h-4" />;
            default:
                return <FaExclamationTriangle className="w-4 h-4" />;
        }
    };

    const isStripeConnected = vendor?.stripeAccountId && vendor?.hasStripeOnboarding;

    return (
        <StoreManagerTemplate>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Payments & Earnings</h1>
                    <div className="flex space-x-2">
                        <select 
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">Last 3 Months</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                </div>

                {/* Stripe Connection Status */}
                {!isStripeConnected && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <FaExclamationTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                            <div>
                                <h3 className="text-sm font-medium text-yellow-800">Stripe Account Not Connected</h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Connect your Stripe account to receive payments and withdrawals.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FaDollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {loading ? '...' : formatCurrency(summary.totalEarnings)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FaCreditCard className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Available</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {loading ? '...' : formatCurrency(summary.available)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <FaClock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {loading ? '...' : formatCurrency(summary.pending)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FaCheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Withdrawn</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {loading ? '...' : formatCurrency(summary.withdrawn)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Button */}
                {summary.available > 0 && isStripeConnected && (
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Withdraw Available Funds</h3>
                                <p className="text-sm text-gray-600">
                                    Withdraw ${formatCurrency(summary.available)} to your connected bank account
                                </p>
                            </div>
                            <button
                                onClick={handleWithdraw}
                                disabled={withdrawLoading}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                {withdrawLoading ? 'Processing...' : 'Withdraw Funds'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Transactions List */}
                <div className="bg-white rounded-lg shadow border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
                    </div>
                    
                    {loading ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-greenPrimary mx-auto"></div>
                            <p className="text-gray-600 mt-2">Loading transactions...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <FaDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                            <p className="text-gray-600">
                                Your transaction history will appear here once you start receiving orders.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Method
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(transaction.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {transaction.customerEmail}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatCurrency(transaction.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                                    {getStatusIcon(transaction.status)}
                                                    <span className="ml-1 capitalize">{transaction.status}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {transaction.method}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {showTour && (
                    <ProductQuickStartGuide 
                        onClose={handleTourFinish}
                    />
                )}
            </div>
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
            <PaymentsContent />
        </Suspense>
    );
}