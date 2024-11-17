// import { db } from "@/lib/firebase";
// import { collection, doc, getDoc, getDocs, limit, orderBy, query, query, where } from "firebase/firestore";
// import { NextRequest, NextResponse } from "next/server";


import { db } from "@/lib/firebase";
import { collection, getDoc, getDocs, limit, orderBy, query, where, startAfter, doc, OrderByDirection, addDoc, setDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const id = request.nextUrl.searchParams.get("id");
        const vendorId = request.nextUrl.searchParams.get("vendorId");
        
        if (id) {
            const docSnap = await getDoc(doc(db, "products", id));

            if (docSnap.exists()) {
                return NextResponse.json({ data: { id: docSnap.id, ...docSnap.data() } });
            } else {
                return NextResponse.json({ error: "Product not found" }, { status: 404 });
            }
        } else if (vendorId) {
            const q = query(collection(db, "products"), where("vendorId", "==", vendorId), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            const products: { [key: string]: any }[] = [];
            querySnapshot.forEach((doc) => {
                products.push({ id: doc.id, ...doc.data() });
            });

            return NextResponse.json({ data: products });
        } else {
            return NextResponse.json({ error: "Required Fields: { id: string } or { vendorId: string }" }, { status: 400 });
        }
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { name, shortDescription, longDescription, tags, categories, price, stockStatus, vendorId, shippingWeight, shippingLength, shippingWidth, shippingHeight, processingTime, upsells, crossSells, isDraft } = await request.json();

        if (!name || !price || !vendorId || isDraft === undefined) {
            return NextResponse.json({ error: "Required Fields: { name: string, price: number, vendorId: string, isDraft: boolean }" }, { status: 400 });
        }

        const productData: { [key: string]: any } = {
            name,
            price,
            vendorId,
            isDraft,
            createdAt: new Date(),
            ...(shortDescription !== undefined && { shortDescription }),
            ...(longDescription !== undefined && { longDescription }),
            ...(tags !== undefined && { tags }),
            ...(categories !== undefined && { categories }),
            ...(stockStatus !== undefined && { stockStatus }),
            ...(shippingWeight !== undefined && { shippingWeight }),
            ...(shippingLength !== undefined && { shippingLength }),
            ...(shippingWidth !== undefined && { shippingWidth }),
            ...(shippingHeight !== undefined && { shippingHeight }),
            ...(processingTime !== undefined && { processingTime }),
            ...(upsells !== undefined && { upsells }),
            ...(crossSells !== undefined && { crossSells }),
        };

        const docRef = await addDoc(collection(db, "products"), productData);

        // add product to vendor's products
        await setDoc(doc(db, "vendors", vendorId), {
            products : {
                [docRef.id]: true
            }
        }, { merge: true });

        return NextResponse.json({ data: { id: docRef.id, ...productData } }, { status: 201 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}