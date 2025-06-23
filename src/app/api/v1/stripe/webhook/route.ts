import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Order } from "@/app/types/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get("stripe-signature") || "";
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (_) {
      return NextResponse.json(
        { error: "Webhook verification failed" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Payment successful:", session);
      console.log("Customer details:", session.customer_details);
      console.log("Shipping details:", session.shipping_details);
      console.log("Customer email:", session.customer_email);
      console.log("Customer ID:", session.customer);

      // Ensure checkout session ID exists in metadata
      if (!session.metadata || !session.metadata.checkoutSessionId) {
        return NextResponse.json(
          { error: "Checkout session ID is missing from metadata" },
          { status: 400 }
        );
      }

      // Retrieve full cart data from Firestore
      let vendorDetails;
      let userId;
      try {
        const checkoutDoc = await getDoc(doc(db, "checkoutSessions", session.metadata.checkoutSessionId));
        if (!checkoutDoc.exists()) {
          return NextResponse.json(
            { error: "Checkout session data not found" },
            { status: 400 }
          );
        }
        
        const checkoutData = checkoutDoc.data();
        vendorDetails = checkoutData.vendorDetails;
        userId = checkoutData.userId; // Store userId for cart clearing
        
        if (!vendorDetails || vendorDetails.length === 0) {
          return NextResponse.json(
            { error: "No vendor details found in checkout session" },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("Failed to retrieve checkout session data:", error);
        return NextResponse.json(
          { error: "Failed to retrieve checkout session data" },
          { status: 400 }
        );
      }

      // Create order documents for each vendor
      const purchaseDate = new Date((session.created || Math.floor(Date.now() / 1000)) * 1000);
      const withdrawAvailableDate = new Date(purchaseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      for (const vendor of vendorDetails) {
        // Build products array for this vendor
        const products = (vendor.cartItems || []).map((item: any) => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images?.[0] || '',
          quantity: item.quantity,
          price: item.product.price,
        }));
        // Calculate subtotal (items only) and total (items + shipping)
        const subtotal = vendor.amount / 100; // Convert cents to dollars
        const shippingCost = (vendor.shippingFee || 0) / 100; // Convert cents to dollars
        const totalAmount = subtotal + shippingCost;
        
        // Get customer information - try multiple sources
        let customerEmail = session.customer_details?.email || session.customer_email || '';
        let customerName = session.customer_details?.name || '';
        
        // If we have a customer ID, fetch more details from Stripe
        if (session.customer && !customerEmail) {
          try {
            const customer = await stripe.customers.retrieve(session.customer as string);
            if (customer && !customer.deleted) {
              customerEmail = customer.email || customerEmail;
              customerName = customer.name || customerName;
            }
          } catch (err) {
            console.log('Could not fetch customer details:', err);
          }
        }

        const order: Order = {
          id: '', // Firestore will generate this
          vendorId: vendor.vendorId,
          vendorName: vendor.vendorName || '',
          products,
          subtotal: subtotal,
          shippingCost: shippingCost,
          amount: totalAmount, // Total amount including shipping
          currency: session.currency || 'usd',
          purchaseDate,
          customerId: session.metadata?.userId || session.customer as string || '',
          customerEmail: customerEmail,
          payoutStatus: 'pending',
          withdrawAvailableDate,
          shippingAddress: {
            name: session.shipping_details?.name || session.customer_details?.name || customerName || '',
            street: session.shipping_details?.address?.line1 || session.customer_details?.address?.line1 || '',
            city: session.shipping_details?.address?.city || session.customer_details?.address?.city || '',
            state: session.shipping_details?.address?.state || session.customer_details?.address?.state || '',
            zip: session.shipping_details?.address?.postal_code || session.customer_details?.address?.postal_code || '',
            country: session.shipping_details?.address?.country || session.customer_details?.address?.country || '',
          },
          refundStatus: 'none',
        };
        const orderRef = await addDoc(collection(db, "orders"), order);

        // --- Enhanced Shippo Integration ---
        try {
          console.log("Starting Shippo integration for order:", orderRef.id);
          
          // 1. Prepare addresses with validation
          // Sender: vendor info (fetch from vendors collection)
          const vendorDoc = await getDoc(doc(db, "vendors", vendor.vendorId));
          const vendorData = vendorDoc.data();
          console.log("Vendor data for shipping:", vendorData);
          
          // Validate vendor address
          if (!vendorData?.storeStreetAddress || !vendorData?.storeCity || !vendorData?.storeState || !vendorData?.storeZip) {
            console.error("Incomplete vendor address for shipping:", vendorData);
            throw new Error(`Vendor address is incomplete for shipping. Missing: ${[
              !vendorData?.storeStreetAddress && 'street',
              !vendorData?.storeCity && 'city', 
              !vendorData?.storeState && 'state',
              !vendorData?.storeZip && 'zip'
            ].filter(Boolean).join(', ')}`);
          }
          
          const address_from = {
            name: vendorData.storeName || 'Store',
            street1: vendorData.storeStreetAddress,
            city: vendorData.storeCity,
            state: vendorData.storeState,
            zip: vendorData.storeZip,
            country: vendorData.storeCountry || 'US',
            phone: vendorData.storePhone || '',
            email: vendorData.storeEmail || '',
          };
          
          // Recipient: order shipping address with validation
          if (!order.shippingAddress.street || !order.shippingAddress.city || !order.shippingAddress.state || !order.shippingAddress.zip) {
            console.error("Incomplete customer address for shipping:", order.shippingAddress);
            throw new Error(`Customer address is incomplete for shipping. Missing: ${[
              !order.shippingAddress.street && 'street',
              !order.shippingAddress.city && 'city',
              !order.shippingAddress.state && 'state', 
              !order.shippingAddress.zip && 'zip'
            ].filter(Boolean).join(', ')}`);
          }
          
          const address_to = {
            name: order.shippingAddress.name || 'Customer',
            street1: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zip: order.shippingAddress.zip,
            country: order.shippingAddress.country || 'US',
          };
          
          console.log("Shippo addresses:", { address_from, address_to });
          
          // 2. Prepare parcels with better defaults and validation
          console.log("Products for shipping calculation:", products);
          console.log("Vendor cart items:", vendor.cartItems);
          
          if (!vendor.cartItems || vendor.cartItems.length === 0) {
            throw new Error("No cart items found for shipping calculation");
          }
          
          const totalWeight = products.reduce((sum: number, p: any) => {
            const cartItem = vendor.cartItems.find((i: any) => i.product.id === p.productId);
            const productWeight = cartItem?.product?.shippingWeight || 1;
            console.log(`Product ${p.productId}: weight ${productWeight}, quantity ${p.quantity}`);
            return sum + (p.quantity * productWeight);
          }, 0);
          
          const maxLength = Math.max(...products.map((p: any) => {
            const cartItem = vendor.cartItems.find((i: any) => i.product.id === p.productId);
            return cartItem?.product?.shippingLength || 6;
          }));
          const maxWidth = Math.max(...products.map((p: any) => {
            const cartItem = vendor.cartItems.find((i: any) => i.product.id === p.productId);
            return cartItem?.product?.shippingWidth || 4;
          }));
          const maxHeight = Math.max(...products.map((p: any) => {
            const cartItem = vendor.cartItems.find((i: any) => i.product.id === p.productId);
            return cartItem?.product?.shippingHeight || 2;
          }));
          
          const parcels = [{
            length: Math.max(maxLength, 1).toString(),
            width: Math.max(maxWidth, 1).toString(),
            height: Math.max(maxHeight, 1).toString(),
            distance_unit: "in",
            weight: Math.max(totalWeight, 0.1).toString(), // Minimum weight
            mass_unit: "lb",
          }];
          
          console.log("Shippo parcels:", parcels);
          
          // 3. Create shipment (get rates)
          const shipmentPayload = {
            address_from,
            address_to,
            parcels,
            async: false,
            extra: {
              reference_1: orderRef.id, // Order reference
              reference_2: `Vendor: ${vendor.vendorName}`,
            }
          };
          
          const shipmentRes = await fetch("https://api.goshippo.com/shipments/", {
            method: "POST",
            headers: {
              "Authorization": `ShippoToken ${process.env.SHIPPO_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(shipmentPayload),
          });
          
          if (!shipmentRes.ok) {
            const errorText = await shipmentRes.text();
            console.error("Shippo shipment creation failed:", errorText);
            throw new Error(`Failed to create Shippo shipment: ${errorText}`);
          }
          
          const shipmentData = await shipmentRes.json();
          console.log("Shippo shipment created:", shipmentData.object_id);
          
          const rates = shipmentData.rates;
          if (!rates || !rates.length) {
            console.error("No Shippo rates available for shipment:", shipmentData);
            throw new Error("No Shippo rates found");
          }
          
          // Pick the cheapest rate (or Ground service if available)
          const groundRate = rates.find((r: any) => r.servicelevel.name.toLowerCase().includes('ground'));
          const cheapestRate = groundRate || rates.reduce((min: any, r: any) => 
            parseFloat(r.amount) < parseFloat(min.amount) ? r : min, rates[0]
          );
          
          console.log("Selected rate:", cheapestRate.servicelevel.name, "$" + cheapestRate.amount);
          
                     // 4. Purchase label (create transaction)
           const transactionPayload = {
             rate: cheapestRate.object_id,
             label_file_type: "PDF",
             async: false
           };
          
          const transactionRes = await fetch("https://api.goshippo.com/transactions", {
            method: "POST",
            headers: {
              "Authorization": `ShippoToken ${process.env.SHIPPO_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(transactionPayload),
          });
          
          if (!transactionRes.ok) {
            const errorText = await transactionRes.text();
            console.error("Shippo transaction creation failed:", errorText);
            throw new Error(`Failed to purchase Shippo label: ${errorText}`);
          }
          
          const transactionData = await transactionRes.json();
          console.log("Shippo label created:", transactionData.object_id);
          
          // 5. Update order with comprehensive shipping info
          await updateDoc(orderRef, {
            shippoLabelUrl: transactionData.label_url,
            trackingNumber: transactionData.tracking_number,
            shippingStatus: "label_created",
            shippoTransactionId: transactionData.object_id,
            shippoShipmentId: shipmentData.object_id,
            shippingCarrier: cheapestRate.provider,
            shippingService: cheapestRate.servicelevel.name,
            shippingCostActual: parseFloat(cheapestRate.amount),
            estimatedDeliveryDate: cheapestRate.estimated_days ? 
              new Date(Date.now() + (cheapestRate.estimated_days * 24 * 60 * 60 * 1000)) : null,
          });
          
          console.log("✅ Shipping label created successfully for order:", orderRef.id);
          
        } catch (err) {
          console.error("❌ Shippo label creation failed for order", orderRef.id, ":", err);
          
          // Update order to indicate shipping label creation failed
          await updateDoc(orderRef, {
            shippingStatus: "label_failed",
            shippingError: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      // Iterate through all vendors and distribute funds
      for (const vendor of vendorDetails) {
        const vendorId = vendor.vendorId;
        const stripeAccountId = vendor.stripeAccountId;
        const amount = vendor.amount; // Amount in cents

        if (!vendorId || !stripeAccountId || !amount) {
          console.error("Invalid vendor data:", vendor);
          continue;
        }

        // Deduct platform fee (10%)
        const platformFee = Math.round(amount * 0.1); // 10% fee from each vendor's amount
        const vendorAmount = amount - platformFee;

        try {
          // Transfer funds to the vendor's connected Stripe account
          await stripe.transfers.create({
            amount: vendorAmount,
            currency: session.currency || "usd",
            destination: stripeAccountId, // Connected Stripe account ID
          });

          console.log(`Transferred $${vendorAmount / 100} to vendor: ${vendorId}`);
        } catch (transferError) {
          console.error(`Tried to transfer ${vendorAmount}. Transfer failed for vendor`, vendorId, transferError);
        }
      }

      // Clear user's cart after successful order processing
      if (userId) {
        try {
          console.log(`Clearing cart for user: ${userId}`);
          
          // Delete the user's cart document
          await deleteDoc(doc(db, "carts", userId));
          
          console.log(`✅ Cart cleared successfully for user: ${userId}`);
        } catch (cartError) {
          console.error(`Failed to clear cart for user ${userId}:`, cartError);
          // Don't fail the entire webhook if cart clearing fails
        }
      } else {
        console.warn("No userId found, cannot clear cart");
      }

      // Clean up temporary checkout session data
      try {
        console.log(`Cleaning up checkout session: ${session.metadata.checkoutSessionId}`);
        await deleteDoc(doc(db, "checkoutSessions", session.metadata.checkoutSessionId));
        console.log("✅ Checkout session cleaned up successfully");
      } catch (cleanupError) {
        console.error("Failed to clean up checkout session:", cleanupError);
        // Don't fail the entire webhook if cleanup fails
      }
    } else if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      console.log("=== ACCOUNT.UPDATED WEBHOOK RECEIVED ===");
      console.log("Account ID:", account.id);
      console.log("Account capabilities:", account.capabilities);
      console.log("Account metadata:", account.metadata);

      const userId = account?.metadata?.userId;
      if (!userId) {
        console.error("❌ User ID not found in account metadata");
        console.error("Available metadata keys:", Object.keys(account.metadata || {}));
        return NextResponse.json(
          { error: "User ID not found in account metadata" },
          { status: 400 }
        );
      }

      console.log("✅ Found userId in metadata:", userId);

      if (account.capabilities && account.capabilities.transfers === "active") {
        console.log("✅ Transfer capability is active, updating vendor status...");
        
        try {
          // Update the vendor's account status in Firestore
          console.log("Updating user vendorSignUpStatus to 'onboardingCompleted'...");
          await setDoc(doc(db, "users", userId), { vendorSignUpStatus: "onboardingCompleted" }, { merge: true });
          
          console.log("Fetching vendor request document...");
          const vendorRequestDoc = await getDoc(doc(db, "vendorRequests", userId));
          
          if (!vendorRequestDoc.exists()) {
            console.error("❌ Vendor request document not found for userId:", userId);
            return NextResponse.json(
              { error: "Vendor request document not found" },
              { status: 400 }
            );
          }
          
          console.log("✅ Found vendor request document");
          const vendorData = vendorRequestDoc.data();
          console.log("Vendor request data keys:", Object.keys(vendorData || {}));

          console.log("Creating/updating vendor document...");
          await setDoc(doc(db, "vendors", userId), {
            stripeAccountId: account.id,
            ownerName: vendorData?.name || "",
            products: [],
            storeCity: vendorData?.storeCity || "",
            storeCountry: vendorData?.storeCountry || "",
            storeDescription: vendorData?.storeDescription || "",
            storeEmail: vendorData?.storeEmail || "",
            storeName: vendorData?.storeName || "",
            storePhone: vendorData?.storePhone || "",
            storeSlug: vendorData?.storeSlug || "",
            storeState: vendorData?.storeState || "",
            storeStreetAddress: vendorData?.storeStreetAddress || "",
            storeZip: vendorData?.storeZip || ""
          }, { merge: true });

          console.log(`✅ Vendor account for user ${userId} is now active and updated`);
        } catch (error) {
          console.error("❌ Error updating vendor status:", error);
          throw error;
        }
      } else {
        console.log("❌ Transfer capability not active yet. Current capabilities:", account.capabilities);
        console.log("Capability status:", account.capabilities?.transfers);
      }
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    } 
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
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
