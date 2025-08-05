"use client";

import React, { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import DashboardSidebar from "@/components/DashboradHelpers/DashboardSidebar";
import { FaUser, FaBars } from "react-icons/fa";
import NoXRedirect from "@/components/NoXRedirect";

type DashboardTemplateProps = {
  children: React.ReactNode;
};

export default function DashboardTemplate({ children }: DashboardTemplateProps) {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Allow all authenticated users
  const isAuthenticated = !!user;

  return (
    <NoXRedirect x={isAuthenticated} redirectUrl="/?login=true">
      <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
        {/* Mobile Topbar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <FaUser className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 truncate">{user?.email}</h2>
              <p className="text-xs text-gray-500">
                {user?.vendorSignUpStatus === "vendorActive" || user?.vendorSignUpStatus === "onboardingStarted" || user?.vendorSignUpStatus === "onboardingCompleted" ? "Vendor Account" : "Customer Account"}
              </p>
            </div>
          </div>
          <button
            className="p-2 rounded-md text-green-600 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <FaBars className="w-6 h-6" />
          </button>
        </div>
        {/* Sidebar for desktop */}
        <div className="hidden md:flex w-72 bg-white border-r shadow-sm">
          <div className="flex flex-col w-full">
            {/* User Profile Section */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <FaUser className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 truncate">{user?.email}</h2>
                  <p className="text-xs text-gray-500">
                    {user?.vendorSignUpStatus === "vendorActive" || user?.vendorSignUpStatus === "onboardingStarted" || user?.vendorSignUpStatus === "onboardingCompleted" ? "Vendor Account" : "Customer Account"}
                  </p>
                </div>
              </div>
            </div>
            {/* Sidebar nav */}
            <DashboardSidebar />
          </div>
        </div>
        {/* Sidebar for mobile (drawer) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar overlay"
            />
            {/* Drawer */}
            <div className="relative w-64 bg-white h-full shadow-xl flex flex-col animate-slideInLeft">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <FaUser className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 truncate">{user?.email}</h2>
                    <p className="text-xs text-gray-500">
                      {user?.vendorSignUpStatus === "vendorActive" || user?.vendorSignUpStatus === "onboardingStarted" || user?.vendorSignUpStatus === "onboardingCompleted" ? "Vendor Account" : "Customer Account"}
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 rounded-md text-green-600 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <DashboardSidebar />
              </div>
            </div>
          </div>
        )}
        {/* Main content */}
        <main className="flex-1 w-full px-2 sm:px-4 py-4 md:py-8 md:px-8 max-w-full">
          {children}
        </main>
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
