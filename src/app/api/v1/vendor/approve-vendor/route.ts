import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/utils/adminAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, getDocs, query, collection, where } from "firebase/firestore";
import { VendorSignUpStatus } from "@/app/types/types";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const adminAuth = await requireAdmin(request);
        if (adminAuth instanceof NextResponse) {
            return adminAuth;
        }

        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        try {
            // CHECK TO SEE IF USER IS ALREADY A VENDOR
            const q = await getDocs(query(collection(db, "vendors"), where("ownerId", "==", uid)));
            if (!q.empty) {
                console.log("SERVER ERROR: User is already a vendor");
                return NextResponse.json({ message: "User is already a vendor" }, { status: 400 });
            }

            // Find user's email
            const userDoc = await getDoc(doc(db, "users", uid));
            const userData = userDoc.data();

            if (!userData) {
                console.log("SERVER ERROR: User not found");
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }

            // Get vendor request data
            const vendorRequestDoc = await getDoc(doc(db, "vendorRequests", uid));
            if (!vendorRequestDoc.exists()) {
                console.log("SERVER ERROR: Vendor request not found");
                return NextResponse.json({ message: "Vendor request not found" }, { status: 404 });
            }

            const vendorRequestData = vendorRequestDoc.data();

            // Create Stripe Connect account immediately
            console.log("🆕 Creating Stripe Connect account for approved vendor...");
            const stripeAccount = await stripe.accounts.create({
                type: "express",
                country: "US",
                email: vendorRequestData.storeEmail || undefined,
                business_type: "individual",
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                settings: {
                    payouts: {
                        schedule: {
                            interval: "manual",
                        },
                    },
                    card_payments: {
                        statement_descriptor_prefix: "FORREEL"
                    }
                },
                business_profile: {
                    product_description: "Fishing products",
                    mcc: "5941", // Sporting Goods Store
                    name: vendorRequestData.storeName || undefined,
                },
                metadata: {
                    userId: uid,
                    storeId: vendorRequestDoc.id,
                }
            });

            console.log("✅ Stripe Connect account created:", stripeAccount.id);

            // Create onboarding link
            console.log("🔗 Creating onboarding link...");
            const accountLink = await stripe.accountLinks.create({
                account: stripeAccount.id,
                refresh_url: `${process.env.NEXT_PUBLIC_URL}/store-manager`,
                return_url: `${process.env.NEXT_PUBLIC_URL}/store-manager`,
                type: "account_onboarding",
                collect: "currently_due",
            });

            console.log("✅ Onboarding link created:", accountLink.url);

            // Create vendor document immediately with Stripe account info
            const vendorData = {
                id: uid,
                ownerId: uid,
                ownerName: vendorRequestData.name,
                products: [],
                storeCity: vendorRequestData.storeCity,
                storeCountry: vendorRequestData.storeCountry || "US",
                storeDescription: vendorRequestData.storeDescription,
                storeEmail: vendorRequestData.storeEmail,
                storeName: vendorRequestData.storeName,
                storePhone: vendorRequestData.storePhone,
                storeSlug: vendorRequestData.storeSlug || vendorRequestData.storeName?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                storeState: vendorRequestData.storeState,
                storeStreetAddress: vendorRequestData.storeStreetAddress,
                storeZip: vendorRequestData.storeZip,
                monthlyEarnings: 0,
                allTimeEarnings: 0,
                lastEarningsUpdate: new Date(),
                stripeAccountId: stripeAccount.id,
                hasStripeOnboarding: false, // Will be set to true when Stripe onboarding is completed
                stripeOnboardingUrl: accountLink.url, // Save the onboarding link for easy access
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Save vendor document
            await setDoc(doc(db, "vendors", uid), vendorData);
            console.log("✅ Created vendor document:", uid);

            // Update vendor request as approved
            await setDoc(doc(db, "vendorRequests", uid), {
                isApproved: true,
                approvedAt: new Date(),
                approvedBy: "admin"
            }, { merge: true });

            // Update user doc to indicate vendor is active but needs Stripe onboarding
            await setDoc(doc(db, "users", uid), {
                vendorSignUpStatus: "vendorActive" as VendorSignUpStatus,
                isVendor: true,
                stripeAccountId: stripeAccount.id
            }, { merge: true });

            console.log("✅ Vendor approved and created successfully");

            return NextResponse.json({ 
                message: "Successfully approved vendor and created vendor account",
                vendor: {
                    id: vendorData.id,
                    storeName: vendorData.storeName,
                    stripeAccountId: stripeAccount.id,
                    onboardingUrl: accountLink.url
                }
            }, { status: 200 });
        } catch (error) {
            if (error instanceof Error) {
                console.error("SERVER ERROR:", error.message);
                return NextResponse.json({ message: error.message }, { status: 500 });
            }
            return NextResponse.json({ message: "Internal server error" }, { status: 500 });
        }
    } catch (error) {
        console.error("SERVER ERROR:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}