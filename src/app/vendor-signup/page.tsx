'use client';

import Button from "@/components/buttons/Button";
import NoXRedirect from "@/components/NoXRedirect";
import { useUser } from "@/contexts/UserContext";
import { DbUser } from "@/lib/firebase-admin";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Page() {
    const { user, refreshUser } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasCheckedRef = useRef(false);
    const checkAttemptsRef = useRef(0);

    const success = searchParams.get("success");

    // Handle success redirect logic
    useEffect(() => {
        const checkOnboardingStatus = async () => {
            if (success === "true" && user && !hasCheckedRef.current) {
                hasCheckedRef.current = true;

                // Function to check status with retries
                const checkStatus = async () => {
                    // Refresh user data
                    await refreshUser();
                    
                    // If onboarding is complete, redirect
                    if (user.vendorSignUpStatus === "onboardingCompleted" && user.stripeDetailsSubmitted) {
                        router.push("/store-manager");
                        return true;
                    }
                    
                    // If we've tried 10 times (20 seconds), stop checking
                    if (checkAttemptsRef.current >= 10) {
                        return false;
                    }
                    
                    // Try again in 2 seconds
                    checkAttemptsRef.current++;
                    setTimeout(checkStatus, 2000);
                };

                // Start checking
                checkStatus();
            }
        };

        checkOnboardingStatus();

        // Reset the refs when success changes
        return () => {
            hasCheckedRef.current = false;
            checkAttemptsRef.current = 0;
        };
    }, [success]);

    const handleStripeSignUp = async () => {
        const createAccountResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stripe/create-connect-account`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ uid: user?.uid })
        });

        if (!createAccountResponse.ok) {
            console.error("Failed to create Stripe account");
            return;
        }

        const accountLinkData = await createAccountResponse.json();
        const onboardingLink = accountLinkData.onboardingLink;

        window.location.href = onboardingLink;
    }

    const handleSubmitReviewApplication = async () => {
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

                        <Button className="mt-3 w-[400px]" text="Continue Stripe Setup" onClick={handleStripeSignUp}/>
                        <p className="text-sm text-gray-500 mt-4">If you're having trouble, you can start over with a new setup.</p>
                    </div>
                );
            } else if (user.vendorSignUpStatus !== "onboardingCompleted") {
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-yellow-600 font-bold mb-8">Setting Up Your Account</h1>
                        <h2 className="text-xl font-semibold mb-2">Please wait while we finish setting up your store...</h2>
                        <p className="text-sm text-gray-600 mb-4">This may take a few moments.</p>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mt-8"></div>
                        <Button 
                            className="mt-8 w-[400px]" 
                            text="Restart Setup Process" 
                            onClick={handleStripeSignUp}
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
                        <h1 className="text-3xl text-green-600 font-bold mb-8">Congratulations on being approved!</h1>
                        <h2 className="text-xl font-semibold mb-2">There are some final steps before your vendor account can be made.</h2>
                        <p className="text-sm text-gray-600">To sell products on For Reel Flies, you must first set up a <span className="text-blue-500 font-semibold">Stripe</span> account.</p>
                        <p className="text-sm text-gray-600">This will allow you to receive payments directly.</p>
                        <p className="text-sm text-gray-600">Please note that you will need to provide some information about your business.</p>
                        <p className="text-sm text-gray-600">Once you complete the setup process, your account will be activated.</p>
                        <p className="text-sm text-gray-600">Then you will be able to start selling your products.</p>

                        <p className="text-sm text-gray-600 mt-8">Note: You will be redirected to Stripe after clicking the button.</p>
                        <p className="text-sm text-gray-600">Once setup is completed, you will return to this page automatically.</p>

                        <Button className="mt-3 w-[400px]" text="Sign Up Through Stripe" onClick={handleStripeSignUp}/>
                    </div>
                )

            case "approvalFormRejected":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-red-600 font-bold mb-8">Application Not Approved</h1>
                        <h2 className="text-xl font-semibold mb-2">We're sorry, but your vendor application was not approved at this time.</h2>
                        <p className="text-sm text-gray-600">If you believe this was a mistake or would like to apply again, please contact our support team.</p>
                    </div>
                )

            case "onboardingStarted":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-blue-600 font-bold mb-8">Onboarding In Progress</h1>
                        <h2 className="text-xl font-semibold mb-2">Please complete your Stripe setup.</h2>
                        <p className="text-sm text-gray-600">Your vendor account will be activated once all steps are completed.</p>
                        <Button className="mt-3 w-[400px]" text="Continue Stripe Setup" onClick={handleStripeSignUp}/>
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