'use server';

import VendorSignupForm from "@/Components/vendorSignupHelpers/VendorSignupForm";

type ApprovalStatus = "approved" | "pending" | "not-submitted";

export default async function Page() {
    const { tokenToUser } = await import("@/lib/firebase-admin");
    const user = await tokenToUser();

    if (!user) {
        // alert("You must be logged in to view this page");
        return <></>
    }

    const getApprovalStatus = async (): Promise<ApprovalStatus> => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/approve-vendor?uid=${user.uid}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        });

        if (response.status === 200) {
            const data = await response.json();

            if (data?.vendorRequest?.isApproved) {
                console.log("approved");
                return "approved";
            } else {
                console.log("pending");
                return "pending";
            }
        } else {
            console.log("not-submitted");
            return "not-submitted";
        }
    }

    const status = await getApprovalStatus();

    switch (status) {
        case "approved":
            return (
                <div className="flex flex-col w-full h-[60vh] items-center justify-center">
                    <div className="bg-greenPrimary p-8 text-center flex flex-col items-center justify-center">
                        <h1 className="text-white text-2xl mb-4">Your Request Was Approved!</h1>
                        <h2 className="text-sm text-white">You can now start selling your products on For Reel Flies.</h2>
                        <h2 className="text-sm text-white font-bold">You can access the store-manager by clicking on your avatar in the top right.</h2>
                        <h3 className="text-sm text-white">Contact us at help@forreelflies.com if there is a problem.</h3>
                    </div>
                </div>
            )
        case "pending":
            return (
                <div className="flex flex-col w-full h-[60vh] items-center justify-center">
                    <div className="bg-greenPrimary p-8 text-center flex flex-col items-center justify-center">
                        <h1 className="text-white text-2xl mb-4">Your Request Is Currently Pending</h1>
                        <h2 className="text-sm text-white">You request will soon be processed.</h2>
                        <h2 className="text-sm text-white">Refresh the page if you believe the status has change.</h2>
                        <h3 className="text-sm text-white">Contact us at help@forreelflies.com if there is a problem.</h3>
                    </div>
                </div>
            )
        case "not-submitted":
            return (
                <VendorSignupForm uid={user?.uid || null} />
            )
    }
}