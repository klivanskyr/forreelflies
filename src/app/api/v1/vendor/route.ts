import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Order } from "@/app/types/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

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

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  if (pathname.endsWith("/withdraw")) {
    try {
      const { vendorId } = await request.json();
      if (!vendorId) {
        return NextResponse.json({ error: "vendorId required" }, { status: 400 });
      }
      // Find eligible orders
      const now = new Date();
      const ordersQuery = query(
        collection(db, "orders"),
        where("vendorId", "==", vendorId),
        where("payoutStatus", "==", "available")
      );
      const snapshot = await getDocs(ordersQuery);
      const eligibleOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((order: any) => order.withdrawAvailableDate.toDate() <= now);
      if (eligibleOrders.length === 0) {
        return NextResponse.json({ error: "No eligible orders for withdrawal" }, { status: 400 });
      }
      // Sum total amount
      const totalAmount = eligibleOrders.reduce((sum: number, order: any) => sum + order.amount, 0);
      // Get vendor's Stripe account ID
      const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
      const stripeAccountId = vendorDoc.data()?.stripeAccountId;
      if (!stripeAccountId) {
        return NextResponse.json({ error: "Vendor Stripe account not found" }, { status: 400 });
      }
      // Initiate Stripe transfer
      const payout = await stripe.transfers.create({
        amount: Math.round(totalAmount * 100), // dollars to cents
        currency: "usd",
        destination: stripeAccountId,
      });
      // Update orders
      const updatedOrderIds: string[] = [];
      for (const order of eligibleOrders) {
        await updateDoc(doc(db, "orders", order.id), {
          payoutStatus: "withdrawn",
          stripeTransferId: payout.id,
        });
        updatedOrderIds.push(order.id);
      }
      return NextResponse.json({ payoutId: payout.id, updatedOrderIds });
    } catch (err) {
      console.error("Withdraw error", err);
      return NextResponse.json({ error: "Withdraw failed" }, { status: 500 });
    }
  }
  // ... existing POST logic ...
}