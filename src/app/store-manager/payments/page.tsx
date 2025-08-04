'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import ProductQuickStartGuide from "@/components/storeManagerHelpers/ProductQuickStartGuide";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

export default function Page() {
    const { user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const showTour = searchParams.get('tour') === '1';
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    
    // Add tour step handling
    const handleTourFinish = () => {
        router.push('/store-manager/products?tour=1');
    };

    // Prefetch next tour page
    useEffect(() => {
        if (showTour) {
            router.prefetch && router.prefetch('/store-manager/products?tour=1');
        }
    }, [showTour, router]);

    return (
        <StoreManagerTemplate>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Payments & Earnings</h1>
                    <div className="flex space-x-2">
                        <select 
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">Last 3 Months</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                </div>

                {/* Rest of your payments UI */}
                
                {showTour && (
                    <ProductQuickStartGuide 
                        onClose={handleTourFinish}
                    />
                )}
            </div>
        </StoreManagerTemplate>
    );
}