import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Order } from "@/app/types/types";
import shippo from "@/lib/shippo";
import type { Rate, Parcel } from "shippo";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Helper function to create shipping label
async function createShippingLabel(order: Order, vendorData: any) {
  try {
    // Validate addresses
    if (!vendorData?.storeStreetAddress || !vendorData?.storeCity || !vendorData?.storeState || !vendorData?.storeZip) {
      console.error("❌ Vendor address incomplete");
      return false;
    }

    if (!order.shippingAddress?.street1 || !order.shippingAddress?.city || 
        !order.shippingAddress?.state || !order.shippingAddress?.zip) {
      console.error("❌ Customer address incomplete");
      return false;
    }

    // Prepare addresses
    const addressFrom = {
      name: vendorData.storeName || 'Store',
      street1: vendorData.storeStreetAddress,
      city: vendorData.storeCity,
      state: vendorData.storeState,
      zip: vendorData.storeZip,
      country: vendorData.storeCountry || 'US',
      phone: vendorData.storePhone || '',
      email: vendorData.storeEmail || '',
    };

    const addressTo = {
      name: order.shippingAddress.name || 'Customer',
      street1: order.shippingAddress.street1,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zip: order.shippingAddress.zip,
      country: order.shippingAddress.country || 'US',
    };

    // Calculate parcel dimensions from products
    const products = order.products || [];
    const totalWeight = products.reduce((sum, p) => sum + (p.quantity * 1), 0); // Default 1 lb per item
    
    const parcels: Parcel[] = [{
      length: "6",
      width: "4", 
      height: "2",
      distanceUnit: "in",
      weight: Math.max(totalWeight, 0.1).toString(),
      massUnit: "lb"
    }];

    // Create shipment
    const shipment = await shippo.shipments.create({
      addressFrom,
      addressTo,
      parcels,
      async: false,
      extra: {
        reference1: (order.id || 'unknown').slice(-30),
        reference2: `Vendor: ${vendorData.storeName}`.slice(0, 30),
      }
    });

    if (!shipment.rates?.length) {
      console.error("❌ No shipping rates available");
      return false;
    }

    // Pick the cheapest rate
    const cheapestRate = shipment.rates.reduce((min, r) => 
      parseFloat(r.amount) < parseFloat(min.amount) ? r : min, shipment.rates[0]
    );

    // Purchase label
    const transaction = await shippo.transactions.create({
      rate: cheapestRate.objectId,
      labelFileType: "PDF",
      async: false
    });

    // Update order with shipping info
    await updateDoc(doc(db, "orders", order.id!), {
      shippoLabelUrl: transaction.labelUrl,
      trackingNumber: transaction.trackingNumber,
      shippingStatus: "label_created",
      shippoTransactionId: transaction.objectId,
      shippoShipmentId: shipment.objectId,
      shippingCarrier: cheapestRate.provider,
      shippingService: cheapestRate.servicelevel.name,
      shippingCostActual: parseFloat(cheapestRate.amount),
      shippingError: null,
    });

    console.log("✅ Shipping label created successfully");
    return true;
  } catch (error) {
    console.error("❌ Error creating shipping label:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const error = err as Error;
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("\n=== ORDER CREATION START ===");
      console.log("Processing completed checkout session:", session.id);

      // Get the checkout session ID from metadata
      const checkoutSessionId = session.metadata?.checkoutSessionId;
      if (!checkoutSessionId) {
        console.error("❌ No checkoutSessionId in session metadata");
        return NextResponse.json({ error: "Missing checkoutSessionId" }, { status: 400 });
      }
      console.log("✅ Found checkout session ID:", checkoutSessionId);

      // Get vendor data from metadata
      const vendorDataStr = session.metadata?.vendorData;
      if (!vendorDataStr) {
        console.error("❌ No vendorData in session metadata");
        return NextResponse.json({ error: "Missing vendorData" }, { status: 400 });
      }
      console.log("✅ Found vendor data in metadata");

      const vendorData = JSON.parse(vendorDataStr);
      console.log("📊 Processing orders for vendors:", vendorData.map((v: any) => v.vendorId).join(", "));
      
      // Get shipping address from session
      const shippingAddress = session.shipping_details?.address;
      const shippingName = session.shipping_details?.name;
      if (!shippingAddress || !shippingName) {
        console.error("❌ Missing shipping details in session");
        return NextResponse.json({ error: "Missing shipping details" }, { status: 400 });
      }
      console.log("✅ Found shipping details");
      console.log("📫 Shipping to:", shippingName);
      console.log("📍 Address:", `${shippingAddress.line1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postal_code}`);

      // Format shipping address for Firestore
      const formattedShippingAddress = {
        name: shippingName,
        street1: shippingAddress.line1 || "",
        street2: shippingAddress.line2 || "",
        city: shippingAddress.city || "",
        state: shippingAddress.state || "",
        zip: shippingAddress.postal_code || "",
        country: shippingAddress.country || "US",
        phone: session.customer_details?.phone || ""
      };

      // Get checkout session data from Firestore
      console.log("\n📦 Fetching checkout session data from Firestore...");
      const checkoutDoc = await getDoc(doc(db, "checkoutSessions", checkoutSessionId));
      if (!checkoutDoc.exists()) {
        console.error("❌ Checkout session not found in Firestore");
        return NextResponse.json({ error: "Checkout session not found" }, { status: 400 });
      }
      console.log("✅ Found checkout session data");

      const checkoutData = checkoutDoc.data();
      
      // Process each vendor's orders
      for (const vendor of vendorData) {
        console.log(`\n🏪 Processing order for vendor: ${vendor.vendorId}`);
        
        // Get vendor details from checkout data
        const vendorDetails = checkoutData.vendorDetails.find((v: any) => v.vendorId === vendor.vendorId);
        if (!vendorDetails) {
          console.error(`❌ No vendor details found for ${vendor.vendorId}`);
          continue;
        }

        // Create a unique order ID
        const orderId = `order_${Date.now()}_${vendor.vendorId}`;
        console.log("📝 Creating order:", orderId);

        // Get vendor data for shipping label
        const vendorDoc = await getDoc(doc(db, "vendors", vendor.vendorId));
        if (!vendorDoc.exists()) {
          console.error(`❌ Vendor document not found for ${vendor.vendorId}`);
          continue;
        }
        const vendorData = vendorDoc.data();

        // Create order object
        const order: Order = {
          id: orderId,
          vendorId: vendor.vendorId,
          vendorName: vendorData.storeName || "Unknown Vendor",
          customerId: checkoutData.userId,
          customerEmail: session.customer_details?.email || "",
          amount: parseFloat(vendor.amount) / 100, // Convert cents to dollars
          subtotal: (vendorDetails.cartItems || []).reduce((sum: number, item: any) => 
            sum + (item.product?.price || 0) * (item.quantity || 1), 
          0),
          shippingCost: parseFloat(vendor.shippingFee) / 100, // Convert cents to dollars
          currency: "usd",
          payoutStatus: "available",
          purchaseDate: new Date(),
          withdrawAvailableDate: new Date(),
          products: (vendorDetails.cartItems || []).map((item: any) => ({
            productId: item.product?.id || "",
            productName: item.product?.name || "Unknown Product",
            productImage: item.product?.images?.[0] || "",
            quantity: item.quantity || 1,
            price: item.product?.price || 0
          })),
          checkoutSessionId: checkoutSessionId,
          shippingAddress: formattedShippingAddress,
          shippingStatus: "pending"
        };

        // Save order to Firestore
        console.log("💾 Saving order to database...");
        await setDoc(doc(db, "orders", orderId), order);
        console.log("✅ Order saved:", orderId);

        // Create shipping label
        console.log("📦 Creating shipping label...");
        const labelCreated = await createShippingLabel(order, vendorData);
        if (!labelCreated) {
          console.log("⚠️ Failed to create shipping label - will need to be retried later");
          await updateDoc(doc(db, "orders", orderId), {
            shippingStatus: "label_failed",
            shippingError: "Failed to create shipping label"
          });
        }
        console.log("✅ Shipping label created for order:", orderId);
        
        // Clear the user's cart items for this vendor
        const userCartRef = doc(db, "carts", checkoutData.userId);
        const userCartDoc = await getDoc(userCartRef);
        
        if (userCartDoc.exists()) {
          const cartData = userCartDoc.data();
          // Filter out items from this vendor
          const updatedItems = (cartData.items || []).filter((item: any) => 
            !vendorDetails.cartItems.some((vendorItem: any) => 
              vendorItem.product.id === item.product.id
            )
          );
          
          // Update the cart with remaining items
          await updateDoc(userCartRef, {
            items: updatedItems
          });
          console.log(`✅ Cleared cart items for vendor: ${vendor.vendorId}`);
        }
      }

      console.log("=== ORDER CREATION COMPLETE ===");
      return NextResponse.json({ success: true });

    } else if (event.type === 'customer.created') {
      const customer = event.data.object as Stripe.Customer;
      console.log("Customer created:", customer.id);
      // Store customer info in Firestore if needed
    } else if (event.type === 'charge.succeeded') {
      const charge = event.data.object as Stripe.Charge;
      console.log("Charge succeeded:", charge.id);
      // Update order status if needed
    } else if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Payment intent succeeded:", paymentIntent.id);
      // Update order status if needed
    } else if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      console.log("Account updated:", account.id);
      // Update vendor account status if needed
    } else if (event.type === 'capability.updated') {
      const capability = event.data.object as Stripe.Capability;
      console.log("Capability updated:", capability.id);
      // Update vendor capabilities if needed
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const error = err as Error;
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Add a GET endpoint to fetch orders for a vendor
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }
    const ordersQuery = query(collection(db, "orders"), where("vendorId", "==", vendorId));
    const snapshot = await getDocs(ordersQuery);
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Failed to fetch vendor orders", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
