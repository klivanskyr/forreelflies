'use client';

import DashboardTemplate from "@/components/DashboradHelpers/DashboardTemplate";

export default function Page() {
    return (
        <DashboardTemplate>
            <div className="relative">
                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🛠️</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
                        <p className="text-gray-600">Wishlist functionality is currently under development.</p>
                    </div>
                </div>
                
                {/* Original Content (hidden behind overlay) */}
                <div className="opacity-50 pointer-events-none">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
                            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                Add Items
                            </button>
                        </div>
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-center text-gray-500 py-12">
                                <div className="text-4xl mb-4">💝</div>
                                <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                                <p className="text-sm">Start adding items you love to your wishlist!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardTemplate>
    );
}