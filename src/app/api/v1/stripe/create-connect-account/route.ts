import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { requireRole } from "@/app/api/utils/withRole";

// THERE IS NO AUTH ON THIS RIGHT NOW.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
    console.log("=== STRIPE CONNECT ACCOUNT CREATION START ===");
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) {
        console.log("❌ User authentication failed");
        return user;
    }

    try {
        const body = await request.json();
        const { uid } = body;
        console.log("📝 Processing request for user:", uid);
        
        if (!uid) {
            console.log("❌ No user ID provided in request");
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // FETCH THE USER FROM FIRESTORE
        console.log("🔍 Fetching user document from Firestore...");
        const userDoc = await getDoc(doc(collection(db, "users"), uid));

        // FETCH THE VENDOR REQUEST INFORMATION FROM FIRESTORE
        console.log("🔍 Fetching vendor request document...");
        const vendorRequestDoc = await getDoc(doc(collection(db, "vendorRequests"), uid));
        
        if (!userDoc.exists() || !vendorRequestDoc.exists()) {
            console.log("❌ User or vendor request document not found");
            console.log("User doc exists:", userDoc.exists());
            console.log("Vendor request doc exists:", vendorRequestDoc.exists());
            return NextResponse.json(
                { error: "User or vendor request not found" },
                { status: 404 }
            );
        }

        console.log("✅ Found user and vendor request documents");

        // Check if user already has a Stripe account
        const existingStripeAccountId = userDoc.data()?.stripeAccountId;
        let accountId = existingStripeAccountId;
        let shouldCreateNewAccount = !existingStripeAccountId;

        // If there's an existing account, check if it's still valid
        if (existingStripeAccountId) {
            try {
                const existingAccount = await stripe.accounts.retrieve(existingStripeAccountId);
                console.log("🔍 Checking existing Stripe account status:", {
                    id: existingAccount.id,
                    details_submitted: existingAccount.details_submitted,
                    charges_enabled: existingAccount.charges_enabled,
                    payouts_enabled: existingAccount.payouts_enabled
                });
                
                // If account is incomplete or has issues, create a new one
                if (!existingAccount.details_submitted || existingAccount.requirements?.disabled_reason) {
                    console.log("⚠️ Existing account has issues, will create new account");
                    shouldCreateNewAccount = true;
                    accountId = null;
                }
            } catch (error) {
                console.log("⚠️ Existing Stripe account not found, will create new account");
                shouldCreateNewAccount = true;
                accountId = null;
            }
        }

        if (shouldCreateNewAccount) {
            console.log("🆕 Creating new Stripe Connect account...");
            
            // Create an Express Connect account
            const account = await stripe.accounts.create({
                type: "express",
                country: "US",
                email: vendorRequestDoc.data()?.storeEmail || undefined,
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
                    name: vendorRequestDoc.data()?.storeName || undefined,
                },
                metadata: {
                    userId: uid,
                    storeId: vendorRequestDoc.id,
                }
            });

            accountId = account.id;
            console.log("✅ Stripe Connect account created:", accountId);
            console.log("Account details:", {
                email: account.email,
                capabilities: account.capabilities,
                details_submitted: account.details_submitted,
                metadata: account.metadata
            });

            // SAVE THE ACCOUNT ID TO FIRESTORE
            console.log("💾 Saving Stripe account ID to user document...");
            await setDoc(doc(db, "users", uid), { 
                stripeAccountId: accountId,
                vendorSignUpStatus: "onboardingStarted"
            }, { merge: true });
            console.log("✅ User document updated with Stripe account ID");
        } else {
            console.log("ℹ️ User already has Stripe account:", existingStripeAccountId);
        }

        // Create the account link for onboarding
        console.log("🔗 Creating account link for onboarding...");
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_URL}/vendor-signup?refresh=true`,
            return_url: `${process.env.NEXT_PUBLIC_URL}/vendor-signup?success=true`,
            type: "account_onboarding",
            collect: "currently_due",
        });

        console.log("✅ Account link created");
        console.log("Return URL:", `${process.env.NEXT_PUBLIC_URL}/vendor-signup?success=true`);
        console.log("Refresh URL:", `${process.env.NEXT_PUBLIC_URL}/vendor-signup?refresh=true`);
        console.log("Onboarding URL:", accountLink.url);
        console.log("=== STRIPE CONNECT ACCOUNT CREATION COMPLETE ===");

        return NextResponse.json({ onboardingLink: accountLink.url }, { status: 200 });
    } catch (error) {
        console.error("❌ Error in Stripe Connect account creation:", error);
        return NextResponse.json(
            { error: "Failed to create Stripe Connect account" },
            { status: 500 }
        );
    }
}