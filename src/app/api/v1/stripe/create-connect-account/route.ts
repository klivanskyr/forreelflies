import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

// THERE IS NO AUTH ON THIS RIGHT NOW.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
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

        const email = userDoc.data()?.email;

        // FIRST WE MAKE THE ACCOUNT
        const account = await stripe.accounts.create({
            type: "express",
            country: "US",
            email: email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            metadata: {
                userId: body.uid, // Assuming uid is passed in the request body
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
            refresh_url: `${process.env.NEXT_PUBLIC_API_URL}/vendor-signup?refresh=true`,
            return_url: `${process.env.NEXT_PUBLIC_API_URL}/vendor-signup?success=true`,
            type: "account_onboarding",
        });

        // // create vendor doc
        // const vendor = await addDoc(collection(db, "vendors"), {
        //     ownerUid: uid,
        //     stripeAccountId: account.id,
        //     status: "pending", 
        //     onboardingLink: accountLink.url, 
        //     email: email,
        //     createdAt: new Date(),
        // });

        // // Update the user document to mark them as a vendor
        // await setDoc(doc(db, "users", uid), {
        //     isVendor: true,
        //     vendorId: vendor.id, // Store the vendor ID in the user document
        // }, { merge: true });
        

        return NextResponse.json({ onboardingLink: accountLink.url }, { status: 200 });
    } catch (error) {
        console.error("Error creating Stripe Connect account:", error);
        return NextResponse.json(
            { error: "Failed to create Stripe Connect account" },
            { status: 500 }
        );
    }
}