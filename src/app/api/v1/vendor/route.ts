import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get("vendorId");
        const userId = searchParams.get("userId");

        if (!vendorId && !userId) {
            console.log("SERVER ERROR: Requires at least of the the following Params: { vendorId: string, userId: string }");
            return NextResponse.json({ message: "Requires at least of the the following Params: { vendorId: string, userId: string }" }, { status: 400 });
        }

        if (vendorId) {
            const vendorDoc = await getDoc(doc(db, "vendors", vendorId));

            if (!vendorDoc.exists()) {
                console.log("SERVER ERROR: Vendor not found");
                return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
            }

            const vendor = vendorDoc.data();

            // Remove ownerUid and ownerName from the response
            const cleanedVendor = {
                ...vendor,
                id: vendorDoc.id,
                ownerUid: undefined,
                ownerName: undefined,
            }

            return NextResponse.json({ vendor: cleanedVendor }, { status: 200 });
        } else {
            const vendorDocs = await getDocs(query(collection(db, "vendors"), where("ownerUid", "==", userId)));

            if (vendorDocs.empty) {
                console.log("SERVER ERROR: Vendor not found");
                return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
            }

            const vendor = vendorDocs.docs.map(doc => doc.data())[0];

            // Remove ownerUid and ownerName from the response
            const cleanedVendor = {
                ...vendor,
                id: vendorDocs.docs[0].id,
                ownerUid: undefined,
                ownerName: undefined,
            }

            return NextResponse.json({ vendor: cleanedVendor }, { status: 200 });
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