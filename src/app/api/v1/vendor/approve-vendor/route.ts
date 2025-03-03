import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const uid = request.nextUrl.searchParams.get("uid");

        if (!uid) {
            console.log("SERVER ERROR: Required Params: { uid: string }");
            return NextResponse.json({ message: "Required Params: { uid: string }" }, { status: 400 });
        }

        const vendorRequestDoc = await getDoc(doc(db, "vendorRequests", uid));

        if (!vendorRequestDoc.exists()) {
            console.log("SERVER ERROR: Vendor request not found");
            return NextResponse.json({ message: "Vendor request not found" }, { status: 404 });
        }

        const vendorRequest = vendorRequestDoc.data();

        return NextResponse.json({ vendorRequest }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            console.log(`SERVER ERROR: ${error.message}`);
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            console.log(`SERVER ERROR: An error occurred: ${error}`);
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { adminEmail, adminPassword, uid } = await request.json();

        if (!adminEmail || !adminPassword || !uid) {
            console.log("SERVER ERROR: Required Fields: { adminUsername: string, adminPassword: string, userId: string }");
            return NextResponse.json({ message: "Required Fields: { adminUsername: string, adminPassword: string, userId: string }" }, { status: 400 });
        }

        try {
            // Check if user is admin
            // Check if user and password is correct
            const adminAuthUser = await signInWithEmailAndPassword(auth, adminEmail, adminPassword)

            if (!adminAuthUser) {
                console.log("SERVER ERROR: Invalid credentials");
                return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
            }
            
            // Check if isAdmin is true
            const adminUserDoc = await getDoc(doc(db, "users", adminAuthUser.user.uid));
            if (!adminUserDoc.exists()) {
                console.log("SERVER ERROR: Admin User not found");
                return NextResponse.json({ message: "Admin User not found" }, { status: 404 });
            }

            const adminUser = adminUserDoc.data();
            if (adminUser.isAdmin !== true) {
                console.log("SERVER ERROR: User is not an admin");
                return NextResponse.json({ message: "User is not an admin" }, { status: 403 });
            }

            // CHECK TO SEE IF USER IS ALREADY A VENDOR
            const q: any = await getDocs(query(collection(db, "vendors"), where("ownerUid", "==", uid)));
            if (!q.empty) {
                console.log("SERVER ERROR: User is already a vendor");
                return NextResponse.json({ message: "User is already a vendor" }, { status: 400 });
            }

            // Find users email
            const userDoc = await getDoc(doc(db, "users", uid));
            const userData = userDoc.data();
            if (!userData) {
                console.log(`SERVER ERROR: User not found with ${uid}`);
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }
            const vendorRequestDoc = await getDoc(doc(db, "vendorRequests", uid));
            const vendorRequest = vendorRequestDoc.data();

            // create stripe account
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")
            const account = await stripe.accounts.create({
                type: "express",
                email: userData.email,
                country: "US",
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: "individual",
            });

            // Generate onboarding link for the vendor
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${process.env.URL}`, // 'https://yourplatform.com/reauth', // CHANGE THIS
                return_url: `${process.env.URL}`, // Where the user is sent after verification
                type: 'account_onboarding',
            });

            await setDoc(doc(db, "vendorRequests", uid), {
                isApproved: true,
                approvedBy: adminAuthUser.user.uid 
            }, { merge: true });

            // update user doc
            await setDoc(doc(db, "users", uid), {
                isVendor: true,
            }, { merge: true });

            // get the vendor request doc 
            if (!vendorRequest) {
                console.log("SERVER ERROR: Vendor request not found");
                return NextResponse.json({ message: "Vendor request not found" }, { status: 404 });
            }

            // create vendor doc
            await addDoc(collection(db, "vendors"), {
                ownerUid: uid,
                ownerName: vendorRequest.name,
                storeName: vendorRequest.storeName,
                storeSlug: vendorRequest.storeSlug,
                storeEmail: vendorRequest.storeEmail,
                storePhone: vendorRequest.storePhone,
                storeDescription: vendorRequest.storeDescription,
                storeStreetAddress: vendorRequest.storeStreetAddress,
                storeCity: vendorRequest.storeCity,
                storeZip: vendorRequest.storeZip,
                storeCountry: vendorRequest.storeCountry,
                storeState: vendorRequest.storeState,
                stripeAccountId: account.id,
                stripeAccountLink: accountLink.url,
            });

            // send onboarding link to the vendor via email

            console.log("Onboarding link: ", accountLink.url);
            return NextResponse.json({ 
                message: "Successfully approved vendor", 
                onboardingUrl: accountLink.url },
                { status: 200 }
            );
        } catch (error) {
            if (error instanceof Error) {
                console.log(`SERVER ERROR: ${error.message}`);
                return NextResponse.json({ error: error.message }, { status: 400 });
            } else {
                console.log(`SERVER ERROR: An error occurred: ${error}`);
                return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
            }
        }
        
    } catch (error) {
        if (error instanceof Error) {
            console.log(`SERVER ERROR: ${error.message}`);
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            console.log(`SERVER ERROR: An error occurred: ${error}`);
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}