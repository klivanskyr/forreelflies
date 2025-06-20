'use client';

import Button from "@/components/buttons/Button";
import NoXRedirect from "@/components/NoXRedirect";
import { useUser } from "@/contexts/UserContext";
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

    if (success) {
        return (
            <NoXRedirect x={user} redirectUrl="/?login=true">
                <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                    <h1 className="text-3xl mb-8 font-bold">Thank you for completing the Stripe onboarding</h1>
                    <p className="text-sm text-gray-500">Return to this page for updates on the status of your vendor account creation.</p>
                    {/* <VendorRequestStatus user={user} /> */}
                </div>
            </NoXRedirect>
        )
    }
    return (
        <NoXRedirect x={user} redirectUrl="/?login=true">
            <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                <h1 className="text-3xl mb-8 font-bold">Become a Verified Vendor</h1>
                <p className="text-sm text-gray-500">To sell products on For Reel Flies, you need to create a <span className="text-black font-semibold">Stripe</span> account.</p>
                <p className="text-sm text-gray-500">This will allow you to receive payments directly.</p>
                <p className="text-sm text-gray-500">Please note that you will need to provide some information about your business.</p>
                <p className="text-sm text-gray-500">Once you complete the onboarding process, your account will be reviewed.</p>
                <p className="text-sm text-gray-500"><span className="text-black font-semibold">If approved</span>, you will be able to start selling your products.</p>

                <Button className="mt-8 w-[400px]" text="Sign Up Through Stripe" onClick={handleStripeSignUp}/>
            </div>
        </NoXRedirect>
    )
}