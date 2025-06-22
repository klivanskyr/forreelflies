import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { requireRole } from "@/app/api/utils/withRole";

// THERE IS NO AUTH ON THIS RIGHT NOW.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;

    try {
        const body = await request.json();
        const { uid } = body;
        
        // check if email is provided
        if (!uid) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // FETCH THE USER FROM FIRESTORE
        const userDoc = await getDoc(doc(collection(db, "users"), uid));

        // FETCH THE VENDOR REQUEST INFORMATION FROM FIRESTORE
        const vendorRequestDoc = await getDoc(doc(collection(db, "vendorRequests"), uid));
        if (!userDoc.exists() || !vendorRequestDoc.exists()) {
            return NextResponse.json(
                { error: "User or vendor request not found" },
                { status: 404 }
            );
        }

        // FIRST WE MAKE THE ACCOUNT
        const nameParts = (userDoc.data()?.name || "").split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");

        const account = await stripe.accounts.create({
            type: "express",
            country: "US",
            email: vendorRequestDoc.data()?.storeEmail || undefined,
            business_type: "individual",
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            metadata: {
              userId: uid,
            },
            individual: {
              first_name: firstName,
              last_name: lastName,
              email: vendorRequestDoc.data()?.storeEmail || undefined,
              phone:vendorRequestDoc.data()?.storePhone || undefined,
              address: {
                line1: vendorRequestDoc.data()?.storeStreetAddress || undefined,
                city: vendorRequestDoc.data()?.storeCity || undefined,
                state: vendorRequestDoc.data()?.storeState || undefined,
                postal_code: userDoc.data()?.storeZip || undefined,
                country: userDoc.data()?.storeCountry || "US",
              },
            },
            business_profile: {
              product_description: userDoc.data()?.storeDescription || "Fishing products",
              mcc: "5941", // Sporting Goods Store (or pick another if better)
              name: userDoc.data()?.storeName || undefined,
            },
            settings: {
              payouts: {
                schedule: {
                  interval: "manual",
                },
              },
            },
          });

        // THEN WE CREATE THE ACCOUNT LINK
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.NEXT_PUBLIC_URL}/vendor-signup?refresh=true`,
            return_url: `${process.env.NEXT_PUBLIC_URL}/vendor-signup?success=true`,
            type: "account_onboarding",
        });

        // SAVE THE ACCOUNT ID TO FIRESTORE
        await setDoc(doc(db, "users", uid), { stripeAccountId: account.id }, { merge: true });

        return NextResponse.json({ onboardingLink: accountLink.url }, { status: 200 });
    } catch (error) {
        console.error("Error creating Stripe Connect account:", error);
        return NextResponse.json(
            { error: "Failed to create Stripe Connect account" },
            { status: 500 }
        );
    }
}