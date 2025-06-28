'use client';

import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { useState } from "react";

export default function Page() {
    const [selectedPeriod, setSelectedPeriod] = useState('Last 30 Days');

    return (
        <StoreManagerTemplate>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    <div className="flex space-x-2">
                        <select 
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                        >
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                            <option>Last 3 Months</option>
                            <option>Last 12 Months</option>
                        </select>
                        <button className="bg-greenPrimary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                        <div className="flex items-center">
                            <div className="p-2 bg-white/20 rounded">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm opacity-90">Total Revenue</p>
                                <p className="text-2xl font-bold">$15,247</p>
                                <p className="text-sm opacity-75">↑ 12% from last month</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                        <div className="flex items-center">
                            <div className="p-2 bg-white/20 rounded">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm opacity-90">Total Orders</p>
                                <p className="text-2xl font-bold">342</p>
                                <p className="text-sm opacity-75">↑ 8% from last month</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                        <div className="flex items-center">
                            <div className="p-2 bg-white/20 rounded">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm opacity-90">Average Order</p>
                                <p className="text-2xl font-bold">$44.57</p>
                                <p className="text-sm opacity-75">↑ 3% from last month</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
                        <div className="flex items-center">
                            <div className="p-2 bg-white/20 rounded">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm opacity-90">New Customers</p>
                                <p className="text-2xl font-bold">89</p>
                                <p className="text-sm opacity-75">↑ 15% from last month</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                                <p>Chart would be rendered here</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
                        <div className="space-y-4">
                            {[
                                { name: 'Premium Fly Rod', sales: 45, revenue: '$2,250' },
                                { name: 'Fly Fishing Kit', sales: 38, revenue: '$1,900' },
                                { name: 'Tackle Box Set', sales: 32, revenue: '$1,280' },
                                { name: 'Fishing Line Pro', sales: 28, revenue: '$560' },
                                { name: 'Dry Flies Pack', sales: 25, revenue: '$375' },
                            ].map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{product.name}</p>
                                        <p className="text-sm text-gray-500">{product.sales} sales</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{product.revenue}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">2,847</p>
                            <p className="text-sm text-gray-500">Page Views</p>
                            <p className="text-xs text-green-600">↑ 23% this month</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">12.3%</p>
                            <p className="text-sm text-gray-500">Conversion Rate</p>
                            <p className="text-xs text-green-600">↑ 1.2% this month</p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">2m 34s</p>
                            <p className="text-sm text-gray-500">Avg. Session</p>
                            <p className="text-xs text-red-600">↓ 5s this month</p>
                        </div>
                    </div>
                </div>
            </div>
        </StoreManagerTemplate>
    )
}