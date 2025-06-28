'use client';

import { useUser } from "@/contexts/UserContext";
import DashboardSidebar from "@/components/DashboradHelpers/DashboardSidebar";
import { FaUser } from "react-icons/fa";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
    const { user } = useUser();

    if (!user) {
        return <></>;
    }
    
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="hidden md:flex w-72 bg-white border-r shadow-sm">
                <div className="flex flex-col w-full">
                    {/* User Profile Section */}
                    <div className="p-6 border-b">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <FaUser className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 truncate">{user.email}</h2>
                                <p className="text-sm text-gray-500">Customer Account</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Navigation */}
                    <div className="p-4">
                        <DashboardSidebar />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
                <div className="max-w-5xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}