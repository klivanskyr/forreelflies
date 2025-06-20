import { VendorSignUpStatus } from "@/app/types/types";
import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

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
            const q = await getDocs(query(collection(db, "vendors"), where("ownerUid", "==", uid)));
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
            await setDoc(doc(db, "vendorRequests", uid), {
                isApproved: true,
                approvedBy: adminAuthUser.user.uid 
            }, { merge: true });

            // update user doc
            await setDoc(doc(db, "users", uid), {
                vendorSignUpStatus: "approvalFormApproved" as VendorSignUpStatus,
            }, { merge: true });

            return NextResponse.json({ message: "Successfully approved vendor"}, { status: 200 });
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