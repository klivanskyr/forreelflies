'use client';

import Button from "@/components/buttons/Button";
import NoXRedirect from "@/components/NoXRedirect";
import { useUser } from "@/contexts/UserContext";

export default function Page() {
    const { user } = useUser();

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
    }

    return (
        <NoXRedirect x={user} redirectUrl="/?login=true">
            <div>
                <h1>Sign up through stripe to become a verified member</h1>
                <Button text="Sign Up Through Stripe" onClick={handleStripeSignUp}/>
            </div>
        </NoXRedirect>
    )
}   
    
    
    
    
    
    
    
    
// 'use client';

// import VendorSignupForm from "@/components/vendorSignupHelpers/VendorSignupForm";
// import { useUser } from "@/contexts/UserContext";
// import { DbUser } from "@/lib/firebase-admin";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// type ApprovalStatus = "approved" | "pending" | "not-submitted";

// export default function Page() {
//     const [status, setStatus] = useState<ApprovalStatus>("not-submitted");
//     const { user } = useUser();
//     const router = useRouter();

//     useEffect(() => {
//         const getApprovalStatus = async (user: DbUser): Promise<ApprovalStatus> => {
//             const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/approve-vendor?uid=${user.uid}`, {
//                 method: "GET",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//             });
    
//             if (response.status === 200) {
//                 const data = await response.json();
    
//                 if (data?.vendorRequest?.isApproved) {
//                     console.log("approved");
//                     return "approved";
//                 } else {
//                     console.log("pending");
//                     return "pending";
//                 }
//             } else {
//                 console.log("not-submitted");
//                 return "not-submitted";
//             }
//         }

//         if (!user) return

//         getApprovalStatus(user).then((status) => {
//             setStatus(status);
//         });

//     }, [user]);

//     if (!user) {
//         router.push("/?login=true");
//         return <></>;
//     }

//     switch (status) {
//         case "approved":
//             return (
//                 <div className="flex flex-col w-full h-[60vh] items-center justify-center">
//                     <div className="bg-greenPrimary p-8 text-center flex flex-col items-center justify-center">
//                         <h1 className="text-white text-2xl mb-4">Your Request Was Approved!</h1>
//                         <h2 className="text-sm text-white">You can now start selling your products on For Reel Flies.</h2>
//                         <h2 className="text-sm text-white font-bold">You can access the store-manager by clicking on your avatar in the top right.</h2>
//                         <h3 className="text-sm text-white">Contact us at help@forreelflies.com if there is a problem.</h3>
//                     </div>
//                 </div>
//             )
//         case "pending":
//             return (
//                 <div className="flex flex-col w-full h-[60vh] items-center justify-center">
//                     <div className="bg-greenPrimary p-8 text-center flex flex-col items-center justify-center">
//                         <h1 className="text-white text-2xl mb-4">Your Request Is Currently Pending</h1>
//                         <h2 className="text-sm text-white">You request will soon be processed.</h2>
//                         <h2 className="text-sm text-white">Refresh the page if you believe the status has change.</h2>
//                         <h3 className="text-sm text-white">Contact us at help@forreelflies.com if there is a problem.</h3>
//                     </div>
//                 </div>
//             )
//         case "not-submitted":
//             return (
//                 <VendorSignupForm uid={user?.uid || null} />
//             )
//     }
// }