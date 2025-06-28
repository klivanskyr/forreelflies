'use client';

import { useUser } from "@/contexts/UserContext";
import DashboardSidebar from "@/components/DashboradHelpers/DashboardSidebar";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
    const { user } = useUser();

    if (!user) {
        return <></>;
    }
    
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="hidden md:flex w-64 p-4 bg-white border-r">
                <div className="flex flex-col w-full">
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900">{user.email}</h2>
                        <p className="text-sm text-gray-500">Dashboard</p>
                    </div>
                    <DashboardSidebar />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8">
                {children}
            </div>
        </div>
    );
}