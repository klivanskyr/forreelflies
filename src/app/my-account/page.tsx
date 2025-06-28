'use client';

import DashboardTemplate from "@/components/DashboradHelpers/DashboardTemplate";
import { useUser } from "@/contexts/UserContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LiaShippingFastSolid as OrdersIcon } from "react-icons/lia";
import { FaRegHeart as WishlistIcon } from "react-icons/fa";
import { IoSettingsOutline as SettingsIcon } from "react-icons/io5";

export default function Page() {
    const { user } = useUser();
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentOrders = async () => {
            try {
                const response = await fetch('/api/v1/user/orders?page=1&pageSize=3');
                const data = await response.json();
                setRecentOrders(data.orders || []);
            } catch (error) {
                console.error('Error fetching recent orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentOrders();
    }, []);

    const quickLinks = [
        {
            title: "My Orders",
            description: "Track, return, or buy things again",
            icon: OrdersIcon,
            href: "/my-account/orders",
            color: "bg-blue-50",
            iconColor: "text-blue-600"
        },
        {
            title: "Wishlist",
            description: "Items you've saved for later",
            icon: WishlistIcon,
            href: "/my-account/wishlist",
            color: "bg-pink-50",
            iconColor: "text-pink-600"
        },
        {
            title: "Account Settings",
            description: "Update your profile and preferences",
            icon: SettingsIcon,
            href: "/my-account/edit-account",
            color: "bg-green-50",
            iconColor: "text-green-600"
        }
    ];

    return (
        <DashboardTemplate>
            <div className="space-y-8">
                {/* Welcome Section */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back{user?.name ? `, ${user.name}` : ''}!</h1>
                    <p className="text-gray-600 mt-2">Manage your orders, wishlist, and account settings here.</p>
                </div>

                {/* Quick Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickLinks.map((link) => (
                        <Link 
                            key={link.title} 
                            href={link.href}
                            className="block p-6 rounded-xl border bg-white hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${link.color}`}>
                                    <link.icon className={`w-6 h-6 ${link.iconColor}`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{link.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Recent Orders Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                        <Link 
                            href="/my-account/orders"
                            className="text-sm text-green-600 hover:text-green-700"
                        >
                            View All Orders
                        </Link>
                    </div>
                    
                    <div className="bg-white rounded-xl border overflow-hidden">
                        {loading ? (
                            <div className="p-6 text-center text-gray-500">Loading recent orders...</div>
                        ) : recentOrders.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                No orders found. Start shopping to see your orders here!
                            </div>
                        ) : (
                            <div className="divide-y">
                                {recentOrders.map((order) => (
                                    <div key={order.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">Order #{order.id}</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {new Date(order.purchaseDate.seconds * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">${order.amount.toFixed(2)}</p>
                                                <p className="text-sm text-gray-600 mt-1">{order.products.length} items</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardTemplate>
    );
}