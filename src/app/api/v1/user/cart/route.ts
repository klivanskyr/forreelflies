import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ message: "id is required" }, { status: 400 });
        }

        const userCartDocs = await getDocs(collection(db, "users", id, "cart"));
        const cart = userCartDocs.docs.map(doc => { 
            return { id: doc.id, quantity: doc.data().quantity }
        });

        return NextResponse.json({ data: cart }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message}, { status: 400 });
        } else {
            return NextResponse.json({ message: `An unknown error occurred: ${error}`} , { status: 400 });
        }
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { userId, productId, quantity } = await request.json();

        if (!userId) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        if (!productId) {
            return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
        }

        if (!quantity) {
            return NextResponse.json({ message: "Quantity is required" }, { status: 400 });
        }

        const userCartItemDoc = await getDoc(doc(db, "users", userId, "cart", productId));

        if (userCartItemDoc.exists()) {
            return NextResponse.json({ message: "Product already in cart" }, { status: 400 });
        }

        setDoc(doc(db, "users", userId, "cart", productId), { quantity: quantity }, { merge: true });

        return NextResponse.json({ message: "Product added to cart" }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message}, { status: 400 });
        } else {
            return NextResponse.json({ message: `An unknown error occurred: ${error}`} , { status: 400 });
        }
    }
}