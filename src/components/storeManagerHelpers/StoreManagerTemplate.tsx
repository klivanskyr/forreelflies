import React, { useState } from "react";
import StoreManagerSidebar from "./StoreManagerSidebar";
import { useUser } from "@/contexts/UserContext";
import NoXRedirect from "@/components/NoXRedirect";

export default function StoreManagerTemplate({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Only allow approved vendors
    const isApprovedVendor = user && (
        user.vendorSignUpStatus === "vendorActive" ||
        user.vendorSignUpStatus === "onboardingStarted" ||
        user.vendorSignUpStatus === "onboardingCompleted"
    );

    return (
        <NoXRedirect x={isApprovedVendor} redirectUrl="/my-account">
            <div className="w-full max-w-[1400px] mx-auto p-4 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-greenPrimary">Vendor Dashboard</h1>
                {/* Hamburger for mobile */}
                <button
                    className="lg:hidden p-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-greenPrimary"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar"
                >
                    <svg className="w-7 h-7 text-greenPrimary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
            <div className="flex gap-6">
                {/* Sidebar: static on desktop, drawer on mobile */}
                <div className="hidden lg:block">
                    <StoreManagerSidebar />
                </div>
                {/* Drawer for mobile */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 flex lg:hidden">
                        {/* Backdrop */}
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        {/* Sidebar Drawer */}
                        <div className="relative z-50 w-64 max-w-full h-full bg-white shadow-xl border-r border-gray-200 animate-slideInLeft">
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
                                onClick={() => setSidebarOpen(false)}
                                aria-label="Close sidebar"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <StoreManagerSidebar />
                        </div>
                    </div>
                )}
                <div className="flex-1 bg-white rounded-lg shadow-card p-4 md:p-6 border border-gray-200 min-w-0">
                    {children}
                </div>
            </div>
            {/* Mobile sidebar slide-in animation */}
            <style jsx global>{`
                @keyframes slideInLeft {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .animate-slideInLeft {
                    animation: slideInLeft 0.25s cubic-bezier(0.4,0,0.2,1);
                }
            `}</style>
        </div>
        </NoXRedirect>
    );
}