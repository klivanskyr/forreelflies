import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

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
                console.log("SERVER ERROR: User not found");
                return NextResponse.json({ message: "User not found" }, { status: 404 });
            }

            const adminUser = adminUserDoc.data();
            if (adminUser.isAdmin !== true) {
                console.log("SERVER ERROR: User is not an admin");
                return NextResponse.json({ message: "User is not an admin" }, { status: 403 });
            }

            // Approve vendor
            // Update requestVendor doc
            await setDoc(doc(db, "vendorRequests", uid), {
                isApproved: true,
                approvedBy: "admin",
            }, { merge: true });

            // update user doc
            await setDoc(doc(db, "users", uid), {
                isVendor: true,
            }, { merge: true });

            // get the vendor request doc 
            const vendorRequestDoc = await getDoc(doc(db, "vendorRequests", uid));
            const vendorRequest = vendorRequestDoc.data();

            if (!vendorRequest) {
                console.log("SERVER ERROR: Vendor request not found");
                return NextResponse.json({ message: "Vendor request not found" }, { status: 404 });
            }

            console.log(vendorRequest);

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
            });
            
            return NextResponse.json({ message: "Successfully approved vendor" }, { status: 200 });
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