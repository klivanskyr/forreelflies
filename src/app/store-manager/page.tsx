'use client';

import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { Vendor } from "../types/types";
import NoXRedirect from "@/components/NoXRedirect";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { DbUser } from "@/lib/firebase-admin";

export default function Page() {
    const { user } = useUser();
    const [vendor, setVendor] = useState<Vendor | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getVendor = async (user: DbUser) => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor?userId=${user.uid}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
        
                if (!response.ok) {
                    return undefined;
                } else {
                    const data = await response.json();
                    return data.vendor as Vendor;
                }
            } catch (error) {
                console.error('Error fetching vendor:', error);
                return undefined;
            }
        }

        if (user) {
            getVendor(user).then((data) => {
                setVendor(data);
                setLoading(false);
            });
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greenPrimary"></div>
                    <p className="text-gray-600">Loading vendor information...</p>
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor not found</h1>
                    <p className="text-gray-600">Unable to load vendor information. Please try again later.</p>
                </div>
            </div>
        )
    }
    
    return (
        <NoXRedirect<Vendor> x={vendor} redirectUrl="/?login=true" alertMessage="You must be logged in as a vendor to access the store manager">
            <StoreManagerTemplate>
                <div className="space-y-6">
                    {/* Welcome Hero Section */}
                    <div className="bg-gradient-to-r from-greenPrimary to-green-600 rounded-lg shadow-lg text-white p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-2xl font-bold">🏪</span>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold">Welcome to Store Manager</h1>
                                    <h2 className="text-xl opacity-90">{vendor.storeName}</h2>
                                    <p className="opacity-75 mt-1">Manage your store, products, and orders</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
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
                                    <p className="text-2xl font-semibold text-gray-900">{vendor.products?.length || 0}</p>
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
                                    <p className="text-2xl font-semibold text-gray-900">$0</p>
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
                            <a href="/store-manager/customization" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-900">Customize Store</span>
                            </a>
                            <a href="/store-manager/settings" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-900">Settings</span>
                            </a>
                        </div>
                    </div>
                </div>
            </StoreManagerTemplate>
        </NoXRedirect>
    )
}