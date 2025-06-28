import { VendorSignUpStatus } from "@/app/types/types";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/utils/adminAuth";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Check if user is authenticated as admin
        const adminAuth = await requireAdmin(request);
        if (adminAuth instanceof NextResponse) return adminAuth;

        const { uid } = await request.json();

        if (!uid) {
            console.log("SERVER ERROR: Required Fields: { uid: string }");
            return NextResponse.json({ message: "Required Fields: { uid: string }" }, { status: 400 });
        }

        try {

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
                approvedBy: "admin",
                approvedAt: new Date().toISOString(),
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