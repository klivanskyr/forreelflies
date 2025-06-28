import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;
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
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;
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

        if (userId !== user.uid) {
            return NextResponse.json({ message: "Unauthorized: userId does not match authenticated user" }, { status: 403 });
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

export async function PUT(request: NextRequest): Promise<NextResponse> {
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;
    try {
        const { userId, productId, quantity } = await request.json();

        if (!userId) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        if (!productId) {
            return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
        }

        if (userId !== user.uid) {
            return NextResponse.json({ message: "Unauthorized: userId does not match authenticated user" }, { status: 403 });
        }

        const userCartItemDoc = await getDoc(doc(db, "users", userId, "cart", productId));

        if (!userCartItemDoc.exists()) {
            return NextResponse.json({ message: "Product not in cart" }, { status: 400 });
        }

        setDoc(doc(db, "users", userId, "cart", productId), { quantity: quantity }, { merge: true });

        return NextResponse.json({ message: "Product quantity updated" }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message}, { status: 400 });
        } else {
            return NextResponse.json({ message: `An unknown error occurred: ${error}`} , { status: 400 });
        }
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const productId = searchParams.get("productId");

        if (!userId) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        if (userId !== user.uid) {
            return NextResponse.json({ message: "Unauthorized: userId does not match authenticated user" }, { status: 403 });
        }

        // If productId is provided, delete specific item
        if (productId) {
            const userCartItemDoc = await getDoc(doc(db, "users", userId, "cart", productId));
            
            if (!userCartItemDoc.exists()) {
                return NextResponse.json({ message: "Product not found in cart" }, { status: 404 });
            }

            await deleteDoc(doc(db, "users", userId, "cart", productId));
            return NextResponse.json({ message: "Product removed from cart successfully" }, { status: 200 });
        }

        // If no productId, clear entire cart (existing functionality)
        const userCartDocs = await getDocs(collection(db, "users", userId, "cart"));
        
        // Delete each cart item
        const deletePromises = userCartDocs.docs.map(doc => 
            deleteDoc(doc.ref)
        );
        
        await Promise.all(deletePromises);

        return NextResponse.json({ message: "Cart cleared successfully" }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ message: error.message}, { status: 400 });
        } else {
            return NextResponse.json({ message: `An unknown error occurred: ${error}`} , { status: 400 });
        }
    }
}

