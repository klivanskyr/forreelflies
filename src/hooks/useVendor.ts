import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';

// Type that matches what the API actually returns
interface VendorData {
    id: string;
    vendorSignUpStatus?: string;
    stripeAccountId?: string;
    stripeOnboardingUrl?: string;
    hasStripeOnboarding?: boolean;
    storeName?: string;
    storeEmail?: string;
    storePhone?: string;
    storeDescription?: string;
    storeCity?: string;
    storeState?: string;
    storeCountry?: string;
    storeStreetAddress?: string;
    storeZip?: string;
    storeSlug?: string;
    monthlyEarnings?: number;
    allTimeEarnings?: number;
    lastEarningsUpdate?: any;
    reviewSummary?: any;
    products?: any[];
    ownerId?: string | undefined;
    ownerName?: string | undefined;
}

export function useVendor() {
    const { user } = useUser();
    const [vendor, setVendor] = useState<VendorData | null>(null);
    const [loading, setLoading] = useState(false); // Start as false to avoid initial flash
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVendor = async () => {
            if (!user?.uid) {
                setVendor(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(`/api/v1/vendor?userId=${user.uid}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setVendor(data.vendor);
                } else {
                    setVendor(null);
                }
            } catch (err) {
                console.error('Error fetching vendor data:', err);
                setError('Failed to fetch vendor data');
                setVendor(null);
            } finally {
                setLoading(false);
            }
        };

        // Start fetching immediately if user is available, with a small delay to prevent rapid re-fetching
        if (user?.uid) {
            const timeoutId = setTimeout(fetchVendor, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [user?.uid]);

    const isApprovedVendor = vendor?.vendorSignUpStatus === "vendorActive" || 
                            vendor?.vendorSignUpStatus === "onboardingStarted" || 
                            vendor?.vendorSignUpStatus === "onboardingCompleted";

    return {
        vendor,
        loading,
        error,
        isApprovedVendor
    };
} 