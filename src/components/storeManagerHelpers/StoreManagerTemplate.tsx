import React from "react";
import StoreManagerSidebar from "./StoreManagerSidebar";

export default function StoreManagerTemplate({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Vendor Dashboard</h1>
            <div className="bg-white rounded shadow p-4 mb-6">
                {/* Vendor profile customization UI will go here */}
                {children}
            </div>
        </div>
    )
}