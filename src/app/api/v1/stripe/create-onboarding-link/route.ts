import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const user = await requireRole(request, "vendor");
        if (user instanceof NextResponse) {
            return user;
        }

        // Get vendor data
        const vendorDoc = await getDoc(doc(db, "vendors", user.uid));
        if (!vendorDoc.exists()) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        const vendorData = vendorDoc.data();
        const stripeAccountId = vendorData.stripeAccountId;

        if (!stripeAccountId) {
            return NextResponse.json({ 
                error: "No Stripe account found. Please create a new Stripe account first." 
            }, { status: 400 });
        }

        if (vendorData.hasStripeOnboarding) {
            return NextResponse.json({ 
                error: "Stripe onboarding already completed" 
            }, { status: 400 });
        }

        // Create onboarding link
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/store-manager`,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/store-manager`,
            type: 'account_onboarding',
        });

        console.log(`✅ Created onboarding link for vendor ${user.uid}: ${accountLink.url}`);

        return NextResponse.json({ 
            url: accountLink.url,
            message: "Onboarding link created successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("❌ Error creating onboarding link:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
            return NextResponse.json({ error: "An error occurred" }, { status: 500 });
        }
    }
}