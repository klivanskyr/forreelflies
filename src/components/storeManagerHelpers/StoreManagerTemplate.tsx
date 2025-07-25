import React from "react";
import StoreManagerSidebar from "./StoreManagerSidebar";

export default function StoreManagerTemplate({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-[85%] mx-auto p-4 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-greenPrimary">Vendor Dashboard</h1>
            <div className="flex gap-6">
                <StoreManagerSidebar />
                <div className="flex-1 bg-white rounded-lg shadow-card p-6 border border-gray-200">
                    {children}
                </div>
            </div>
        </div>
    )
}