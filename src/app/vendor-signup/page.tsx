'use client';

import Button from "@/components/buttons/Button";
import NoXRedirect from "@/components/NoXRedirect";
import { useUser } from "@/contexts/UserContext";
import { DbUser } from "@/lib/firebase-admin";
import { useRouter, useSearchParams } from "next/navigation";

export default function Page() {
    const { user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();

    const success = searchParams.get("success");
    // const refresh = searchParams.get("refresh");

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

        router.push(onboardingLink);
    }

    const handleSubmitReviewApplication = async () => {
        router.push("/vendor-signup/form");
    }

    function DisplayVendorStatusMessage({ user }: { user: DbUser }) {
        console.log('Vendor signup page - User vendorSignUpStatus:', user.vendorSignUpStatus);
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
                        <p className="text-sm text-gray-600">To sell products on For Reel Flies, you must first be approved <span className="text-blue-500 font-semibold">Stripe</span> account.</p>
                        <p className="text-sm text-gray-600">This will allow you to receive payments directly.</p>
                        <p className="text-sm text-gray-600">Please note that you will need to provide some information about your business.</p>
                        <p className="text-sm text-gray-600">Once you complete the onboarding process, your account will be reviewed.</p>
                        <p className="text-sm text-gray-600">Once onboarding is completed, you will be able to start selling your products.</p>

                        <p className="text-sm text-gray-600 mt-8">Note: You will be redirected after clicking the button.</p>
                        <p className="text-sm text-gray-600">Once <span className="text-blue-500 font-semibold">Stripe</span> onboarding is completed, you will return to this page automatically.</p>

                        <Button className="mt-3 w-[400px]" text="Sign Up Through Stripe" onClick={handleStripeSignUp}/>
                    </div>
                )

            case "approvalFormRejected":
                return (
                    <div>
                        
                    </div>
                )

            case "onboardingStarted":
                return (
                    <div>

                    </div>
                )

            case "onboardingCompleted":
                return (
                    <div>
                        
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
            <DisplayVendorStatusMessage user={user} />
        </NoXRedirect>
    )
}