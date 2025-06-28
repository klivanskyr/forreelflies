'use client';

import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { Vendor } from "../types/types";
import NoXRedirect from "@/components/NoXRedirect";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { DbUser } from "@/lib/firebase-admin";
import NoVendorRedirect from "@/components/storeManagerHelpers/NoVendorRedirect";

export default function Page() {
    const { user } = useUser();
    const [vendor, setVendor] = useState<Vendor | undefined>(undefined);
    const [totalProducts, setTotalProducts] = useState(0);
    const [monthlyEarnings, setMonthlyEarnings] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getVendor = async (user: DbUser) => {
            try {
                const res = await fetch(`/api/v1/vendor?userId=${user.uid}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                const data = await res.json();
                setVendor(data.vendor);
            } catch (error) {
                console.error("Failed to fetch vendor:", error);
            }
        };

        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch vendor data
                await getVendor(user);

                // Fetch products count
                const productsRes = await fetch(`/api/v1/product?vendorId=${user.uid}`);
                const productsData = await productsRes.json();
                setTotalProducts(productsData.data?.length || 0);

                // Fetch monthly earnings
                const transactionsRes = await fetch(`/api/v1/vendor/transactions?vendorId=${user.uid}&period=month`);
                const transactionsData = await transactionsRes.json();
                setMonthlyEarnings(transactionsData.summary?.totalEarnings || 0);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greenPrimary"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <NoVendorRedirect vendor={vendor}>
            <StoreManagerTemplate>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Store Dashboard</h1>
                        <div className="text-sm text-gray-600">
                            Last updated: {new Date().toLocaleString()}
                        </div>
                    </div>

                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                                    <p className="text-2xl font-semibold text-gray-900">{totalProducts}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Store Status</p>
                                    <p className="text-2xl font-semibold text-green-600">Active</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">This Month</p>
                                    <p className="text-2xl font-semibold text-gray-900">${monthlyEarnings.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <a href="/store-manager/products" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-900">Add Product</span>
                            </a>
                            <a href="/store-manager/orders" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-900">View Orders</span>
                            </a>
                            <a href="/store-manager/reviews" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-8 h-8 text-yellow-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-900">Reviews</span>
                            </a>
                            <a href="/store-manager/payments" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-900">Payments</span>
                            </a>
                        </div>
                    </div>
                </div>
            </StoreManagerTemplate>
        </NoVendorRedirect>
    );
}