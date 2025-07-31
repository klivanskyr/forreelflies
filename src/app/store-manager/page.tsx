'use client';

import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { Vendor } from "../types/types";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState } from "react";
import { DbUser } from "@/lib/firebase-admin";
import NoVendorRedirect from "@/components/storeManagerHelpers/NoVendorRedirect";
import Button from "@/components/buttons/Button";
import { toast } from "sonner";
import ProductQuickStartGuide from "@/components/ProductQuickStartGuide";

export default function Page() {
    const { user } = useUser();
    const [vendor, setVendor] = useState<Vendor | undefined>(undefined);
    const [totalProducts, setTotalProducts] = useState(0);
    const [monthlyEarnings, setMonthlyEarnings] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isProcessingStripe, setIsProcessingStripe] = useState(false);

    useEffect(() => {
        const getVendor = async (user: DbUser) => {
            try {
                const res = await fetch(`/api/v1/vendor?userId=${user.uid}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                const data = await res.json();
                setVendor(data.vendor);
            } catch (error) {
                console.error("Failed to fetch vendor:", error);
            }
        };

        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch vendor data
                await getVendor(user);

                // Fetch products count
                const productsRes = await fetch(`/api/v1/product?vendorId=${user.uid}`);
                const productsData = await productsRes.json();
                setTotalProducts(productsData.data?.length || 0);

                // Fetch monthly earnings
                const transactionsRes = await fetch(`/api/v1/vendor/transactions?vendorId=${user.uid}&period=month`);
                const transactionsData = await transactionsRes.json();
                setMonthlyEarnings(transactionsData.summary?.totalEarnings || 0);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleStripeOnboarding = async () => {
        if (!user?.uid) {
            toast.error("You must be logged in to set up Stripe payments");
            return;
        }

        setIsProcessingStripe(true);

        try {
            // Check if vendor has a saved onboarding URL
            if (vendor?.stripeOnboardingUrl) {
                console.log("Using saved onboarding URL");
                toast.success("Opening Stripe onboarding...");
                window.open(vendor.stripeOnboardingUrl, '_blank');
                return;
            }

            // Check if vendor already has a Stripe account
            if (vendor?.stripeAccountId) {
                // Create onboarding link for existing account
                const onboardingResponse = await fetch('/api/v1/stripe/create-onboarding-link', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                if (!onboardingResponse.ok) {
                    const errorData = await onboardingResponse.json();
                    console.error("Failed to create onboarding link:", errorData);
                    toast.error(`Failed to create onboarding link: ${errorData.error || "Unknown error"}`);
                    return;
                }

                const onboardingData = await onboardingResponse.json();
                toast.success("Opening Stripe onboarding...");
                window.open(onboardingData.url, '_blank');
                return;
            }

            // Create new Stripe account
            const createAccountResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/create-connect-account`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ uid: user.uid })
            });

            if (!createAccountResponse.ok) {
                const errorData = await createAccountResponse.json();
                console.error("Failed to create Stripe account:", errorData);
                
                if (createAccountResponse.status === 401) {
                    toast.error("Authentication failed. Please log in and try again.");
                } else if (createAccountResponse.status === 400) {
                    toast.error("Invalid account setup request. Please contact support.");
                } else if (createAccountResponse.status >= 500) {
                    toast.error("Payment system temporarily unavailable. Please try again in a few minutes.");
                } else {
                    toast.error(`Failed to set up payment account: ${errorData.error || "Unknown error"}`);
                }
                return;
            }

            const accountLinkData = await createAccountResponse.json();
            
            if (!accountLinkData.onboardingLink) {
                console.error("No onboarding link received:", accountLinkData);
                toast.error("Failed to generate setup link. Please try again.");
                return;
            }

            toast.success("Redirecting to Stripe setup...");
            window.location.href = accountLinkData.onboardingLink;

        } catch (networkError) {
            console.error("Network error during Stripe signup:", networkError);
            
            if (networkError instanceof TypeError && networkError.message.includes("fetch")) {
                toast.error("Connection error. Please check your internet connection and try again.");
            } else {
                toast.error("Failed to connect to payment setup. Please try again.");
            }
        } finally {
            setIsProcessingStripe(false);
        }
    };

    const [showTour, setShowTour] = useState(false);
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greenPrimary"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }
    return (
        <NoVendorRedirect vendor={vendor}>
            <StoreManagerTemplate>
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
                            <button
                                className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all text-base"
                                onClick={() => setShowTour(true)}
                                data-testid="dashboard-tour-btn"
                            >
                                🚀 Take Dashboard Tour
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            Last updated: {new Date().toLocaleString()}
                        </div>
                    </div>

                    {/* Stripe Onboarding Alert */}
                    {vendor && !vendor.hasStripeOnboarding && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-medium text-yellow-800">
                                        Complete Payment Setup
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p className="mb-3">
                                            You need to complete your Stripe payment setup to withdraw earnings from your sales. 
                                            You can still receive orders and sell products, but you won't be able to withdraw funds until this is completed.
                                        </p>
                                        <div className="mt-4">
                                            <Button 
                                                text={isProcessingStripe ? "Setting up..." : "Set Up Payment Processing"}
                                                onClick={handleStripeOnboarding}
                                                disabled={isProcessingStripe}
                                                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Products</p>
                                    <p className="text-2xl font-semibold text-gray-900">{totalProducts}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Store Status</p>
                                    <p className="text-2xl font-semibold text-green-600">Active</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-100 rounded">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">This Month</p>
                                    <p className="text-2xl font-semibold text-gray-900">${monthlyEarnings.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <a data-tour="products" href="/store-manager/products" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-900">Add Product</span>
                            </a>
                            <a data-tour="orders" href="/store-manager/orders" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-900">View Orders</span>
                            </a>
                            <a data-tour="reviews" href="/store-manager/reviews" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-8 h-8 text-yellow-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-900">Reviews</span>
                            </a>
                            <a data-tour="payments" href="/store-manager/payments" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                <span className="text-sm font-medium text-gray-900">Payments</span>
                            </a>
                        </div>
                    </div>
                </div>
                {showTour && (
                    <ProductQuickStartGuide onClose={() => setShowTour(false)} />
                )}
            </StoreManagerTemplate>
        </NoVendorRedirect>
    );
}