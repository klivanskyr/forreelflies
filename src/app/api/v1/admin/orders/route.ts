import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/utils/adminAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { Order } from "@/app/types/types";

export async function GET(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const vendorId = searchParams.get('vendorId');

        let ordersQuery;
        if (orderId) {
            // If orderId is provided, fetch specific order
            const orderDoc = await getDoc(doc(db, "orders", orderId));
            if (!orderDoc.exists()) {
                return NextResponse.json({ error: "Order not found" }, { status: 404 });
            }
            return NextResponse.json({ orders: [{ id: orderDoc.id, ...orderDoc.data() }] });
        } else if (vendorId) {
            // If vendorId is provided, fetch vendor's orders
            ordersQuery = query(collection(db, "orders"), where("vendorId", "==", vendorId));
        } else {
            // Fetch all orders
            ordersQuery = query(collection(db, "orders"));
        }

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;

    try {
        const { orderId, updates } = await request.json();
        
        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        // Get the order
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (!orderDoc.exists()) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Update the order
        await updateDoc(doc(db, "orders", orderId), {
            ...updates,
            lastModifiedBy: "admin",
            lastModifiedAt: new Date()
        });

        // Get the updated order
        const updatedOrderDoc = await getDoc(doc(db, "orders", orderId));
        
        return NextResponse.json({ 
            order: { id: updatedOrderDoc.id, ...updatedOrderDoc.data() }
        });
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 