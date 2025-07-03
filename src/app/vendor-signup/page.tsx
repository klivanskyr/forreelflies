'use client';

import Button from "@/components/buttons/Button";
import NoXRedirect from "@/components/NoXRedirect";
import { useUser } from "@/contexts/UserContext";
import { DbUser } from "@/lib/firebase-admin";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useEffect, useState } from "react";
import toast from "react-hot-toast";

function VendorSignUpContent() {
    const { user, refreshUser } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const success = searchParams.get("success");
    const hasCheckedRef = useRef(false);
    const checkAttemptsRef = useRef(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            if (!user || hasCheckedRef.current || checkAttemptsRef.current >= 3) return;
            
            hasCheckedRef.current = true;
            checkAttemptsRef.current++;

            try {
                const checkStatus = async () => {
                    console.log(`Checking onboarding status (attempt ${checkAttemptsRef.current})`);
                    await refreshUser();
                };

                // Check immediately, then set up intervals for retries
                await checkStatus();
                
                if (success === "true" && user.vendorSignUpStatus !== "onboardingCompleted") {
                    // Set up retry mechanism for up to 30 seconds
                    const interval = setInterval(async () => {
                        if (checkAttemptsRef.current >= 6) { // 6 attempts over 30 seconds
                            clearInterval(interval);
                            if (user.vendorSignUpStatus !== "onboardingCompleted") {
                                toast.error("Onboarding verification is taking longer than expected. Please contact support if this persists.");
                            }
                            return;
                        }
                        
                        checkAttemptsRef.current++;
                        await checkStatus();
                        
                        if (user.vendorSignUpStatus === "onboardingCompleted") {
                            clearInterval(interval);
                            toast.success("Vendor account setup completed successfully!");
                        }
                    }, 5000); // Check every 5 seconds
                }
            } catch (error) {
                console.error("Error checking onboarding status:", error);
                toast.error("Failed to verify account status. Please refresh the page.");
            }
        };

        checkOnboardingStatus();

        // Reset the refs when success changes
        return () => {
            hasCheckedRef.current = false;
            checkAttemptsRef.current = 0;
        };
    }, [success, user, refreshUser]);

    const handleStripeSignUp = async () => {
        if (!user?.uid) {
            toast.error("You must be logged in to set up Stripe payments");
            return;
        }

        setIsProcessing(true);

        try {
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
                    router.push("/?login=true");
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
            setIsProcessing(false);
        }
    }

    const handleSubmitReviewApplication = async () => {
        if (!user?.uid) {
            toast.error("You must be logged in to submit an application");
            return;
        }
        
        router.push("/vendor-signup/form");
    }

    function DisplayVendorStatusMessage({ user }: { user: DbUser }) {
        console.log('Vendor signup page - User vendorSignUpStatus:', user.vendorSignUpStatus);
        
        // If we're on success page but onboarding isn't complete, show retry screen
        if (success === "true") {
            if (user.vendorSignUpStatus === "stripeSetupPending" || user.vendorSignUpStatus === "onboardingStarted") {
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-yellow-600 font-bold mb-8">Complete Your Stripe Setup</h1>
                        <h2 className="text-xl font-semibold mb-2">You haven't completed your Stripe account setup yet.</h2>
                        <p className="text-sm text-gray-600 mb-4">You need to finish setting up your account to receive payments.</p>
                        
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-[600px] mb-8">
                            <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Important</p>
                            <p className="text-sm text-yellow-700">Please complete all the required steps in the Stripe setup process to activate your vendor account.</p>
                        </div>

                        <Button 
                            className="mt-3 w-[400px]" 
                            text={isProcessing ? "Setting up..." : "Continue Stripe Setup"} 
                            onClick={handleStripeSignUp}
                            disabled={isProcessing}
                        />
                        <p className="text-sm text-gray-500 mt-4">If you're having trouble, you can start over with a new setup.</p>
                    </div>
                );
            } else if (user.vendorSignUpStatus === "onboardingCompleted") {
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-green-600 font-bold mb-8">Welcome to ForReelFlies!</h1>
                        <h2 className="text-xl font-semibold mb-2">Your vendor account is now active and ready to use.</h2>
                        <p className="text-sm text-gray-600 mb-8">You can now start managing your store and listing products for sale.</p>
                        <Button 
                            className="mt-3 w-[400px]" 
                            text="Go to Store Manager" 
                            onClick={() => router.push("/store-manager")}
                        />
                    </div>
                );
            } else {
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-yellow-600 font-bold mb-8">Setting Up Your Account</h1>
                        <h2 className="text-xl font-semibold mb-2">Please wait while we finish setting up your store...</h2>
                        <p className="text-sm text-gray-600 mb-4">This may take a few moments.</p>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mt-8"></div>
                        <Button 
                            className="mt-8 w-[400px]" 
                            text={isProcessing ? "Processing..." : "Restart Setup Process"} 
                            onClick={handleStripeSignUp}
                            disabled={isProcessing}
                        />
                    </div>
                );
            }
        }
        
        switch (user.vendorSignUpStatus) {
            case "notStarted":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-gray-800 font-bold mb-8">Welcome to ForReelFlies Vendor Sign Up!</h1>
                        <h2 className="text-xl font-semibold mb-2">To start selling your products, please fill out the vendor application form.</h2>
                        <p className="text-sm text-gray-600">Once you submit the form, we will review your application.</p>
                        <p className="text-sm text-gray-600">If approved, you will be able to start selling your products on For Reel Flies.</p>
                        <Button className="mt-3 w-[400px]" text="Start Vendor Application" onClick={handleSubmitReviewApplication}/>
                    </div>
                )

            case "submittedApprovalForm":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-gray-800 font-bold mb-8">Thank you for submitting your application!</h1>
                        <h2 className="text-xl font-semibold mb-2">Your application is under review.</h2>
                        <p className="text-sm text-gray-600">We will review your application and get back to you shortly</p>
                        <p className="text-sm text-gray-600">If approved, you will be able to start selling your products on For Reel Flies.</p>
                        <p className="text-sm text-gray-600">Thank you for your patience.</p>
                    </div>
                )

            case "approvalFormApproved":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-green-600 font-bold mb-8">Congratulations! Your application has been approved!</h1>
                        <h2 className="text-xl font-semibold mb-2">Next step: Set up your payment account with Stripe.</h2>
                        <p className="text-sm text-gray-600 mb-4">This is required to receive payments from customers.</p>
                        
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-[600px] mb-8">
                            <p className="text-sm text-blue-800 font-semibold mb-2">What happens next:</p>
                            <ul className="text-sm text-blue-700 text-left list-disc list-inside space-y-1">
                                <li>Click the button below to start Stripe setup</li>
                                <li>You'll be redirected to Stripe to provide business information</li>
                                <li>Complete identity verification and banking details</li>
                                <li>Return here when finished to start selling</li>
                            </ul>
                        </div>

                        <Button 
                            className="mt-3 w-[400px]" 
                            text={isProcessing ? "Setting up..." : "Set Up Payment Account"} 
                            onClick={handleStripeSignUp}
                            disabled={isProcessing}
                        />
                    </div>
                )

            case "approvalFormRejected":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-red-600 font-bold mb-8">Application Not Approved</h1>
                        <h2 className="text-xl font-semibold mb-2">We're sorry, but your vendor application was not approved at this time.</h2>
                        <p className="text-sm text-gray-600 mb-4">If you believe this was a mistake or would like to apply again, please contact our support team.</p>
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-[600px]">
                            <p className="text-sm text-red-800">
                                For questions about your application status, please contact us at support@forreelflies.com
                            </p>
                        </div>
                    </div>
                )

            case "onboardingStarted":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-blue-600 font-bold mb-8">Onboarding In Progress</h1>
                        <h2 className="text-xl font-semibold mb-2">Please complete your Stripe setup.</h2>
                        <p className="text-sm text-gray-600 mb-4">Your vendor account will be activated once all steps are completed.</p>
                        
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-[600px] mb-8">
                            <p className="text-sm text-blue-800">
                                If you were in the middle of setting up your Stripe account, click below to continue where you left off.
                            </p>
                        </div>

                        <Button 
                            className="mt-3 w-[400px]" 
                            text={isProcessing ? "Loading..." : "Continue Stripe Setup"} 
                            onClick={handleStripeSignUp}
                            disabled={isProcessing}
                        />
                    </div>
                )

            case "onboardingCompleted":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-green-600 font-bold mb-8">Onboarding Completed!</h1>
                        <h2 className="text-xl font-semibold mb-2">Your vendor account is now active.</h2>
                        <p className="text-sm text-gray-600 mb-8">You can now start managing your store and listing products.</p>
                        <Button className="mt-3 w-[400px]" text="Go to Store Manager" onClick={() => router.push("/store-manager")}/>
                    </div>
                )
            
            default:
                // Handle undefined, null, or unexpected statuses
                console.log('Unknown or undefined vendorSignUpStatus, treating as notStarted');
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-gray-800 font-bold mb-8">Welcome to ForReelFlies Vendor Sign Up!</h1>
                        <h2 className="text-xl font-semibold mb-2">To start selling your products, please fill out the vendor application form.</h2>
                        <p className="text-sm text-gray-600">Once you submit the form, we will review your application.</p>
                        <p className="text-sm text-gray-600">If approved, you will be able to start selling your products on For Reel Flies.</p>
                        <Button className="mt-3 w-[400px]" text="Start Vendor Application" onClick={handleSubmitReviewApplication}/>
                    </div>
                )
        }   
    }

    if (!user) return <></>

    return (
        <NoXRedirect x={user} redirectUrl="/?login=true">
            <div className="my-20">
                <DisplayVendorStatusMessage user={user} />
            </div>
        </NoXRedirect>
    )
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="w-full h-full flex flex-col flex-1 justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
            </div>
        }>
            <VendorSignUpContent />
        </Suspense>
    );
}