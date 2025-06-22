import { db } from "@/lib/firebase";
import { collection, getDocs, getDoc, query, limit, doc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Aggregate top-selling products from orders
        const orderDocs = await getDocs(collection(db, "orders"));
        const salesMap: Record<string, number> = {};
        orderDocs.forEach((doc) => {
            const order = doc.data();
            if (order.products) {
                order.products.forEach((p: any) => {
                    salesMap[p.productId] = (salesMap[p.productId] || 0) + (p.quantity || 0);
                });
            }
        });
        // Sort productIds by quantity sold
        const topProductIds = Object.entries(salesMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([productId]) => productId);
        let products: any[] = [];
        if (topProductIds.length > 0) {
            // Fetch product details for top sellers
            for (const productId of topProductIds) {
                const productDoc = await getDoc(doc(db, "products", productId));
                if (productDoc.exists()) {
                    products.push({ id: productDoc.id, ...productDoc.data() });
                }
            }
        } else {
            // No sales yet, fallback to first 5 products
            const productsRef = collection(db, "products");
            const snapshot = await getDocs(query(productsRef, limit(5)));
            products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        return NextResponse.json({ data: products });
    } catch (err) {
        console.error("Failed to fetch top selling products", err);
        return NextResponse.json({ error: "Failed to fetch top selling products" }, { status: 500 });
    }
} 