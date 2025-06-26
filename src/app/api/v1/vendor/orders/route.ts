import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(request: NextRequest) {
    const user = await requireRole(request, "vendor");
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('vendorId');

        if (!vendorId) {
            return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
        }

        // Verify the user is requesting their own orders
        if (user.uid !== vendorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Query orders where vendorId matches
        const ordersQuery = query(
            collection(db, "orders"),
            where("vendorId", "==", vendorId)
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore timestamp to serializable format
            purchaseDate: doc.data().purchaseDate?.toDate?.() ? {
                seconds: doc.data().purchaseDate.seconds,
                nanoseconds: doc.data().purchaseDate.nanoseconds
            } : doc.data().purchaseDate,
            withdrawAvailableDate: doc.data().withdrawAvailableDate?.toDate?.() ? {
                seconds: doc.data().withdrawAvailableDate.seconds,
                nanoseconds: doc.data().withdrawAvailableDate.nanoseconds
            } : doc.data().withdrawAvailableDate
        })).sort((a: any, b: any) => {
            // Sort by purchaseDate descending (newest first)
            const dateA = a.purchaseDate?.seconds || 0;
            const dateB = b.purchaseDate?.seconds || 0;
            return dateB - dateA;
        });

        return NextResponse.json({ orders }, { status: 200 });

    } catch (error) {
        console.error("Error fetching vendor orders:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log("\n=== ORDER CREATION START ===");
    const user = await requireRole(request, "vendor");
    if (user instanceof NextResponse) {
        console.log("❌ User authentication failed");
        return user;
    }
    console.log("✅ Vendor authenticated:", user.uid);

    try {
        const { checkoutSessionId, paymentIntentId } = await request.json();
        console.log("💳 Processing order for checkout session:", checkoutSessionId);
        console.log("Payment Intent ID:", paymentIntentId);

        // Fetch checkout session data
        console.log("\n📋 Fetching checkout session data...");
        const checkoutDoc = await getDoc(doc(db, "checkoutSessions", checkoutSessionId));
        if (!checkoutDoc.exists()) {
            console.log("❌ Checkout session not found:", checkoutSessionId);
            return NextResponse.json({ error: "Checkout session not found" }, { status: 404 });
        }
        const checkoutData = checkoutDoc.data();
        console.log("✅ Checkout session data retrieved");

        // Validate payment intent
        console.log("\n🔍 Validating payment intent...");
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
            console.log("❌ Payment not successful. Status:", paymentIntent.status);
            return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
        }
        console.log("✅ Payment validated");

        // Create orders for each vendor
        console.log("\n📦 Creating orders for vendors...");
        const orders = [];
        for (const vendor of checkoutData.vendorDetails) {
            console.log(`\n🏪 Processing vendor: ${vendor.vendorId}`);
            
            // Create order document
            const orderId = `order_${Date.now()}_${vendor.vendorId}`;
            const orderData = {
                orderId,
                vendorId: vendor.vendorId,
                userId: checkoutData.userId,
                items: vendor.cartItems,
                amount: vendor.amount,
                shippingFee: vendor.shippingFee,
                status: "pending",
                createdAt: new Date(),
                paymentIntentId,
                checkoutSessionId
            };

            console.log("📝 Order details:");
            console.log("- Order ID:", orderId);
            console.log("- Items:", vendor.cartItems.length);
            console.log("- Amount:", vendor.amount);
            console.log("- Shipping Fee:", vendor.shippingFee);

            // Save order to Firestore
            console.log("💾 Saving order to database...");
            await setDoc(doc(db, "orders", orderId), orderData);
            console.log("✅ Order saved");

            orders.push(orderData);
        }

        console.log("\n✅ All orders created successfully");
        console.log("Total orders created:", orders.length);
        console.log("=== ORDER CREATION COMPLETE ===\n");

        return NextResponse.json({ orders });

    } catch (error) {
        console.error("❌ Error creating orders:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 