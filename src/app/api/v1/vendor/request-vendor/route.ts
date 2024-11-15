import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { uid, name, storeName, storeSlug, storeEmail, storePhone, storeDescription, storeStreetAddress, storeCity, storeZip, storeCountry, storeState } = await request.json();

        if (!uid || !name || !storeName || !storeSlug || !storeEmail || !storePhone || !storeDescription || !storeStreetAddress || !storeCity || !storeZip || !storeCountry || !storeState) {
            console.log("SERVER ERROR: Required Fields: { uid: string, name: string, storeName: string, storeSlug: string, storeEmail: string, storePhone: string, storeDescription: string, storeStreetAddress: string, storeCity: string, storeZip: string, storeCountry: string, storeState: string }");
            return NextResponse.json({ message: "Required Fields: { uid: string, name: string, storeName: string, storeSlug: string, storeEmail: string, storePhone: string, storeDescription: string, storeStreetAddress: string, storeCity: string, storeZip: string, storeCountry: string, storeState: string }" }, { status: 400 });
        }

        try {
            // Check if vendorRequest already exists
            const vendorRequestDoc = await getDoc(doc(db, "vendorRequests", uid));

            if (vendorRequestDoc.exists()) {
                console.log("SERVER ERROR: Vendor request already exists");
                return NextResponse.json({ message: "Vendor request already exists" }, { status: 400 });
            }

            await setDoc(doc(db, "vendorRequests", uid), {
                isApproved: false,
                name,
                storeName,
                storeSlug,
                storeEmail,
                storePhone,
                storeDescription,
                storeStreetAddress,
                storeCity,
                storeZip,
                storeCountry,
                storeState,
            });

            return NextResponse.json({ message: "Successfully submitted vendor request" }, { status: 200 });
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