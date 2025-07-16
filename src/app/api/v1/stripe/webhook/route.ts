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
    // Convert shipping address to Shippo format - use correct field names
    const toAddress = {
      name: order.shippingAddress.name,
      street1: order.shippingAddress.address1, // Map address1 to street1 for Shippo
      street2: order.shippingAddress.address2 || '', // Map address2 to street2 for Shippo
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zip: order.shippingAddress.zip,
      country: order.shippingAddress.country,
      phone: "" // Not required by Shippo
    };

    // Get vendor address from vendorData - fix the address structure
    const fromAddress = {
      name: vendorData.storeName || "Unknown Store",
      street1: vendorData.storeStreetAddress || "", // Use correct field name for Shippo
      street2: '', // Most vendors won't have street2
      city: vendorData.storeCity || "",
      state: vendorData.storeState || "",
      zip: vendorData.storeZip || "",
      country: vendorData.storeCountry || 'US',
      phone: vendorData.storePhone || ""
    };

    console.log("📍 From address for shipping:", fromAddress);

    // Validate addresses before creating shipment
    if (!fromAddress.street1 || !fromAddress.city || !fromAddress.state || !fromAddress.zip) {
      console.error("❌ Incomplete vendor address:", fromAddress);
      console.error("❌ Missing fields:", {
        street1: !fromAddress.street1,
        city: !fromAddress.city,
        state: !fromAddress.state,
        zip: !fromAddress.zip
      });
      throw new Error(`Vendor address is incomplete. Missing: ${[
        !fromAddress.street1 && 'street address',
        !fromAddress.city && 'city',
        !fromAddress.state && 'state',
        !fromAddress.zip && 'zip'
      ].filter(Boolean).join(', ')}`);
    }

    console.log("📍 To address for shipping:", toAddress);

    if (!toAddress.street1 || !toAddress.city || !toAddress.state || !toAddress.zip) {
      console.error("❌ Incomplete customer address:", toAddress);
      console.error("❌ Missing customer fields:", {
        street1: !toAddress.street1,
        city: !toAddress.city,
        state: !toAddress.state,
        zip: !toAddress.zip
      });
      throw new Error(`Customer address is incomplete. Missing: ${[
        !toAddress.street1 && 'street address',
        !toAddress.city && 'city',
        !toAddress.state && 'state',
        !toAddress.zip && 'zip'
      ].filter(Boolean).join(', ')}`);
    }

    // Calculate parcel dimensions based on order items
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;

    // Fetch product data to get shipping dimensions
    for (const product of order.products) {
      try {
        const productDoc = await getDoc(doc(db, "products", product.productId));
        if (productDoc.exists()) {
          const productData = productDoc.data();
          const quantity = product.quantity;
          
          // Add weight (multiply by quantity)
          totalWeight += (productData.shippingWeight || 1) * quantity;
          
          // Use maximum dimensions for length and width
          maxLength = Math.max(maxLength, productData.shippingLength || 6);
          maxWidth = Math.max(maxWidth, productData.shippingWidth || 6);
          
          // Stack heights (multiply by quantity for stackable items)
          totalHeight += (productData.shippingHeight || 2) * quantity;
        } else {
          console.warn(`Product ${product.productId} not found, using default dimensions`);
          totalWeight += 1 * product.quantity; // Default 1 lb per item
          maxLength = Math.max(maxLength, 6);
          maxWidth = Math.max(maxWidth, 6);
          totalHeight += 2 * product.quantity; // Default 2 inches per item
        }
      } catch (error) {
        console.error(`Error fetching product ${product.productId}:`, error);
        // Use defaults
        totalWeight += 1 * product.quantity;
        maxLength = Math.max(maxLength, 6);
        maxWidth = Math.max(maxWidth, 6);
        totalHeight += 2 * product.quantity;
      }
    }

    // Apply reasonable limits and minimums
    totalWeight = Math.max(0.1, Math.min(totalWeight, 70)); // 0.1 to 70 lbs
    maxLength = Math.max(1, Math.min(maxLength, 108)); // 1 to 108 inches
    maxWidth = Math.max(1, Math.min(maxWidth, 108)); // 1 to 108 inches
    totalHeight = Math.max(1, Math.min(totalHeight, 108)); // 1 to 108 inches

    console.log(`📦 Calculated parcel dimensions: ${maxLength}"L x ${maxWidth}"W x ${totalHeight}"H, ${totalWeight}lbs`);

    // Create parcel object with calculated dimensions
    const parcel: Parcel = {
      length: maxLength.toString(),
      width: maxWidth.toString(),
      height: totalHeight.toString(),
      distanceUnit: "in",
      weight: totalWeight.toString(),
      massUnit: "lb"
    };

    // Create shipment
    const shipment = await shippo.shipments.create({
      addressFrom: fromAddress,
      addressTo: toAddress,
      parcels: [parcel],
      async: false
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
    
    // Update order with shipping error but don't fail the entire webhook
    if (order.id) {
      await updateDoc(doc(db, "orders", order.id), {
        shippingStatus: "label_failed",
        shippingError: error instanceof Error ? error.message : "Unknown shipping error"
      });
    }
    
    return false; // Return false instead of throwing to prevent webhook failure
  }
}

// Helper function to handle completed Stripe onboarding
async function handleAccountOnboardingCompleted(account: Stripe.Account) {
    try {
        console.log("🔍 Processing completed onboarding for account:", account.id);
        
        // Get user ID from account metadata
        const userId = account.metadata?.userId;
        if (!userId) {
            console.error("❌ No userId found in account metadata");
            return;
        }
        
        console.log("👤 Found user ID in metadata:", userId);
        
        // Create a processing lock to prevent race conditions from multiple webhook events
        const lockId = `vendor_creation_${userId}`;
        const lockRef = doc(db, "processing_locks", lockId);
        
        try {
            // Try to create the lock atomically
            await setDoc(lockRef, {
                userId,
                accountId: account.id,
                startedAt: new Date(),
                status: "processing"
            }, { merge: false }); // This will fail if document already exists
            console.log("✅ Acquired vendor creation lock");
        } catch (error) {
            // If lock already exists, another webhook call is processing this vendor creation
            console.log("⚠️ Vendor creation lock already exists - another webhook is handling this. Skipping.");
            return;
        }
        
        try {
            // Check if vendor already exists
            const existingVendorQuery = query(collection(db, "vendors"), where("ownerId", "==", userId));
            const existingVendorSnapshot = await getDocs(existingVendorQuery);
            
            if (!existingVendorSnapshot.empty) {
                console.log("⚠️ Vendor already exists for user:", userId);
                // Update existing vendor with Stripe account ID and onboarding status
                const vendorDoc = existingVendorSnapshot.docs[0];
                const vendorData = vendorDoc.data();
                
                const updateData: any = {
                    updatedAt: new Date()
                };
                
                if (!vendorData.stripeAccountId) {
                    updateData.stripeAccountId = account.id;
                    console.log("✅ Updated existing vendor with Stripe account ID");
                }
                
                if (!vendorData.hasStripeOnboarding) {
                    updateData.hasStripeOnboarding = true;
                    console.log("✅ Updated existing vendor with Stripe onboarding status");
                }
                
                await updateDoc(vendorDoc.ref, updateData);
                
                // Update user status to completed
                await updateDoc(doc(db, "users", userId), {
                    vendorSignUpStatus: "onboardingCompleted"
                });
                console.log("✅ Updated user status to onboardingCompleted");
                
                // Clean up the lock
                await deleteDoc(lockRef);
                return;
            }
            
            // Get vendor request data
            const vendorRequestDoc = await getDoc(doc(db, "vendorRequests", userId));
            if (!vendorRequestDoc.exists()) {
                console.error("❌ No vendor request found for user:", userId);
                // Clean up the lock
                await deleteDoc(lockRef);
                return;
            }
            
            const vendorRequestData = vendorRequestDoc.data();
            console.log("📋 Found vendor request data");
            
            // Create vendor document
            const vendorId = userId; // Use user ID as vendor ID
            const vendorData = {
                id: vendorId,
                ownerId: userId,
                ownerName: vendorRequestData.name,
                products: [],
                storeCity: vendorRequestData.storeCity,
                storeCountry: vendorRequestData.storeCountry || "US",
                storeDescription: vendorRequestData.storeDescription,
                storeEmail: vendorRequestData.storeEmail,
                storeName: vendorRequestData.storeName,
                storePhone: vendorRequestData.storePhone,
                storeSlug: vendorRequestData.storeSlug || vendorRequestData.storeName?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                storeState: vendorRequestData.storeState,
                storeStreetAddress: vendorRequestData.storeStreetAddress,
                storeZip: vendorRequestData.storeZip,
                monthlyEarnings: 0,
                allTimeEarnings: 0,
                lastEarningsUpdate: new Date(),
                stripeAccountId: account.id,
                hasStripeOnboarding: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            // Save vendor document
            await setDoc(doc(db, "vendors", vendorId), vendorData);
            console.log("✅ Created vendor document:", vendorId);
            
            // Update user status to completed
            await updateDoc(doc(db, "users", userId), {
                vendorSignUpStatus: "onboardingCompleted",
                isVendor: true
            });
            console.log("✅ Updated user status to onboardingCompleted");
            
            console.log("🎉 Vendor onboarding completed successfully!");
            
            // Clean up the lock
            await deleteDoc(lockRef);
            console.log("✅ Vendor creation lock cleaned up");
            
        } catch (processingError) {
            console.error("❌ Error during vendor creation processing:", processingError);
            // Clean up the lock in case of error
            try {
                await deleteDoc(lockRef);
                console.log("✅ Vendor creation lock cleaned up after error");
            } catch (lockCleanupError) {
                console.error("❌ Error cleaning up vendor creation lock:", lockCleanupError);
            }
            throw processingError; // Re-throw to trigger outer catch
        }
        
    } catch (error) {
        console.error("❌ Error handling account onboarding completion:", error);
    }
}

export async function POST(request: NextRequest) {
    // 🔍 PRODUCTION DEBUGGING - Add comprehensive logging
    console.log("🔍 WEBHOOK DEBUG - Request received");
    console.log("🔍 Timestamp:", new Date().toISOString());
    console.log("🔍 Request URL:", request.url);
    console.log("🔍 Request method:", request.method);
    
    // Log headers (but mask sensitive data)
    const headers = Object.fromEntries(request.headers.entries());
    console.log("🔍 Headers:", {
        ...headers,
        'stripe-signature': headers['stripe-signature'] ? '[PRESENT]' : '[MISSING]'
    });
    
    // Log environment variables presence
    console.log("🔍 Environment check:", {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '[PRESENT]' : '[MISSING]',
        STRIPE_WEBHOOK_SECRET_PERSONAL: process.env.STRIPE_WEBHOOK_SECRET_PERSONAL ? '[PRESENT]' : '[MISSING]',
        STRIPE_WEBHOOK_SECRET_CONNECTED: process.env.STRIPE_WEBHOOK_SECRET_CONNECTED ? '[PRESENT]' : '[MISSING]',
        NODE_ENV: process.env.NODE_ENV
    });

    const payload = await request.text();
    console.log("🔍 Payload length:", payload.length);
    console.log("🔍 Payload preview:", payload.substring(0, 200) + "...");
    
    const sig = request.headers.get('stripe-signature');

    if (!sig || (!process.env.STRIPE_WEBHOOK_SECRET_PERSONAL && !process.env.STRIPE_WEBHOOK_SECRET_CONNECTED)) {
        console.error('❌ WEBHOOK DEBUG - Missing signature or webhook secrets');
        console.error('❌ Signature present:', !!sig);
        console.error('❌ Personal webhook secret present:', !!process.env.STRIPE_WEBHOOK_SECRET_PERSONAL);
        console.error('❌ Connected webhook secret present:', !!process.env.STRIPE_WEBHOOK_SECRET_CONNECTED);
        return NextResponse.json({ error: 'Missing signature or webhook secrets' }, { status: 400 });
    }

    let event: Stripe.Event;
    let webhookSecret: string;

    // First, try to construct the event with both secrets to determine which one works
    // This is necessary because we don't know the event type until after verification
    try {
        console.log("🔍 WEBHOOK DEBUG - Attempting to construct event with personal secret");
        if (process.env.STRIPE_WEBHOOK_SECRET_PERSONAL) {
            event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET_PERSONAL);
            webhookSecret = 'PERSONAL';
            console.log("✅ WEBHOOK DEBUG - Event constructed successfully with PERSONAL secret");
        } else {
            throw new Error('Personal webhook secret not available');
        }
    } catch (personalErr) {
        console.log("⚠️ WEBHOOK DEBUG - Personal secret failed, trying connected secret");
        try {
            if (process.env.STRIPE_WEBHOOK_SECRET_CONNECTED) {
                event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET_CONNECTED);
                webhookSecret = 'CONNECTED';
                console.log("✅ WEBHOOK DEBUG - Event constructed successfully with CONNECTED secret");
            } else {
                throw new Error('Connected webhook secret not available');
            }
        } catch (connectedErr) {
            console.error('❌ WEBHOOK DEBUG - Both webhook secrets failed');
            console.error('❌ Personal error:', personalErr instanceof Error ? personalErr.message : String(personalErr));
            console.error('❌ Connected error:', connectedErr instanceof Error ? connectedErr.message : String(connectedErr));
            console.error('❌ Personal secret length:', process.env.STRIPE_WEBHOOK_SECRET_PERSONAL?.length || 0);
            console.error('❌ Connected secret length:', process.env.STRIPE_WEBHOOK_SECRET_CONNECTED?.length || 0);
            console.error('❌ Signature length:', sig?.length || 0);
            console.error('❌ Payload length:', payload.length);
            return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
        }
    }

    console.log('✅ Webhook received:', event.type);
    console.log('✅ Event ID:', event.id);
    console.log('✅ Event created:', new Date(event.created * 1000).toISOString());
    console.log('✅ Webhook secret used:', webhookSecret);

    // Validate that the correct webhook secret was used for the event type
    const isCheckoutEvent = event.type === 'checkout.session.completed';
    const isPaymentEvent = event.type.startsWith('payment_intent.') || event.type.startsWith('charge.') || event.type.startsWith('payment.');
    const isAccountEvent = event.type.startsWith('account.') || event.type.startsWith('capability.') || event.type.startsWith('person.') || event.type === 'financial_connections.account.created';
    
    if ((isCheckoutEvent || isPaymentEvent) && webhookSecret !== 'PERSONAL') {
        console.error(`❌ Wrong webhook secret used for ${event.type}. Expected PERSONAL, got ${webhookSecret}`);
        return NextResponse.json({ error: 'Wrong webhook endpoint for this event type' }, { status: 400 });
    }
    
    if (isAccountEvent && webhookSecret !== 'CONNECTED') {
        console.error(`❌ Wrong webhook secret used for ${event.type}. Expected CONNECTED, got ${webhookSecret}`);
        return NextResponse.json({ error: 'Wrong webhook endpoint for this event type' }, { status: 400 });
    }
    
    console.log('✅ Webhook secret validation passed');

    try {
        // Log additional details based on event type
        const eventObject = event.data.object;
        
        // Handle payment-related events
        if (event.type.startsWith('payment.')) {
            console.log('💰 Payment event:', {
                type: event.type,
                amount: (eventObject as any).amount,
                currency: (eventObject as any).currency,
                status: (eventObject as any).status,
                created: new Date((eventObject as any).created * 1000).toISOString()
            });
        }
        // Handle transfer-related events
        else if (event.type.startsWith('transfer.')) {
            console.log('🔄 Transfer event:', {
                type: event.type,
                amount: (eventObject as any).amount,
                currency: (eventObject as any).currency,
                destination: (eventObject as any).destination,
                created: new Date((eventObject as any).created * 1000).toISOString()
            });
        }
        // Handle balance events
        else if (event.type === 'balance.available') {
            const available = ((eventObject as any).available || []).map((fund: any) => ({
                amount: fund.amount,
                currency: fund.currency
            }));
            const pending = ((eventObject as any).pending || []).map((fund: any) => ({
                amount: fund.amount,
                currency: fund.currency
            }));
            console.log('💳 Balance available:', {
                available,
                pending,
                updated: new Date().toISOString()
            });
        }
        // Handle checkout completion
        else if (event.type === 'checkout.session.completed') {
            const session = eventObject as Stripe.Checkout.Session;
            console.log("\n=== ORDER CREATION START ===");
            console.log("Processing completed checkout session:", session.id);

            // Get the checkout session ID from metadata
            const checkoutSessionId = session.metadata?.checkoutSessionId;
            if (!checkoutSessionId) {
                console.error("❌ No checkoutSessionId in session metadata");
                return NextResponse.json({ error: "Missing checkoutSessionId" }, { status: 400 });
            }
            console.log("✅ Found checkout session ID:", checkoutSessionId);

            // Create a processing lock to prevent race conditions
            const lockId = `processing_${checkoutSessionId}`;
            const lockRef = doc(db, "processing_locks", lockId);
            
            try {
                // Try to create the lock atomically
                await setDoc(lockRef, {
                    checkoutSessionId,
                    startedAt: new Date(),
                    status: "processing"
                }, { merge: false }); // This will fail if document already exists
                console.log("✅ Acquired processing lock for checkout session");
            } catch (error) {
                // If lock already exists, another webhook call is processing this session
                console.log("⚠️ Processing lock already exists - another webhook is handling this session. Skipping.");
                return NextResponse.json({ success: true, message: "Already being processed by another webhook" });
            }

            // Double-check if orders already exist for this checkout session
            const existingOrdersQuery = query(collection(db, "orders"), where("checkoutSessionId", "==", checkoutSessionId));
            const existingOrdersSnapshot = await getDocs(existingOrdersQuery);
            
            if (!existingOrdersSnapshot.empty) {
                console.log("⚠️ Orders already exist for this checkout session. Cleaning up lock and skipping.");
                // Clean up the lock
                await deleteDoc(lockRef);
                return NextResponse.json({ success: true, message: "Orders already processed" });
            }

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
                address1: shippingAddress.line1 || "",
                address2: shippingAddress.line2 || "",
                city: shippingAddress.city || "",
                state: shippingAddress.state || "",
                zip: shippingAddress.postal_code || "",
                country: shippingAddress.country || "US"
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
            console.log("🔍 Full checkout session data:", {
                userId: checkoutData.userId,
                vendorDetailsCount: checkoutData.vendorDetails?.length || 0,
                vendorDetails: checkoutData.vendorDetails?.map((v: any) => ({
                    vendorId: v.vendorId,
                    vendorName: v.vendorName,
                    cartItemsCount: v.cartItems?.length || 0,
                    cartItems: v.cartItems || "undefined",
                    amount: v.amount,
                    shippingFee: v.shippingFee
                })) || "no vendor details"
            });
            
            // Process each vendor's orders - wrap in try-catch to ensure lock cleanup
            try {
            for (const vendor of vendorData) {
                console.log(`\n🏪 Processing order for vendor: ${vendor.vendorId}`);
                
                // Get vendor details from checkout data
                const vendorDetails = checkoutData.vendorDetails.find((v: any) => v.vendorId === vendor.vendorId);
                if (!vendorDetails) {
                    console.error(`❌ No vendor details found for ${vendor.vendorId}`);
                    continue;
                }
                console.log("🛒 Vendor cart items:", {
                    vendorId: vendor.vendorId,
                    cartItemsCount: vendorDetails.cartItems?.length || 0,
                    cartItems: vendorDetails.cartItems?.map((item: any) => ({
                        productId: item.product?.id,
                        name: item.product?.name,
                        quantity: item.quantity,
                        price: item.product?.price
                    })) || []
                });

                // Debug: Log the raw cart items structure to understand the issue
                console.log("🔍 Raw vendorDetails for", vendor.vendorId, ":", {
                    vendorDetails: vendorDetails ? "exists" : "undefined",
                    cartItems: vendorDetails?.cartItems ? "exists" : "undefined",
                    cartItemsArray: vendorDetails?.cartItems,
                    rawVendorDetailsStructure: Object.keys(vendorDetails || {})
                });

                // Create a unique order ID using checkout session and vendor ID
                const orderId = `order_${checkoutSessionId}_${vendor.vendorId}`;
                console.log("📝 Creating order:", orderId);

                // Check if this specific order already exists (extra safety)
                const existingOrderDoc = await getDoc(doc(db, "orders", orderId));
                if (existingOrderDoc.exists()) {
                    console.log(`⚠️ Order ${orderId} already exists, skipping`);
                    continue;
                }

                // Get vendor data for shipping label
                const vendorDoc = await getDoc(doc(db, "vendors", vendor.vendorId));
                if (!vendorDoc.exists()) {
                    console.error(`❌ Vendor document not found for ${vendor.vendorId}`);
                    continue;
                }
                const vendorDocData = vendorDoc.data();
                console.log("🏪 Vendor data for shipping:", {
                    vendorId: vendor.vendorId,
                    storeName: vendorDocData.storeName,
                    hasStreetAddress: !!vendorDocData.storeStreetAddress,
                    storeStreetAddress: vendorDocData.storeStreetAddress,
                    storeCity: vendorDocData.storeCity,
                    storeState: vendorDocData.storeState,
                    storeZip: vendorDocData.storeZip,
                    storeCountry: vendorDocData.storeCountry
                });

                // Calculate subtotal from products
                const subtotal = (vendorDetails.cartItems || []).reduce((sum: number, item: any) => 
                    sum + (item.product?.price || 0) * (item.quantity || 1), 
                0);

                // Create order object
                const order: Order = {
                    id: orderId,
                    vendorId: vendor.vendorId,
                    vendorName: vendorDocData.storeName || "Unknown Vendor",
                    customerId: checkoutData.userId,
                    customerEmail: session.customer_details?.email || "",
                    customerName: shippingName || "",
                    subtotal: subtotal,
                    amount: parseFloat(vendor.amount) / 100, // Total amount including shipping
                    shippingCost: parseFloat(vendor.shippingFee) / 100,
                    payoutStatus: "pending_delivery",
                    purchaseDate: new Date(),
                    withdrawAvailableDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                    products: (vendorDetails.cartItems || []).map((item: any) => ({
                        productId: item.product?.id || "",
                        productName: item.product?.name || "Unknown Product",
                        productImage: item.product?.images?.[0] || undefined,
                        quantity: item.quantity || 1,
                        price: item.product?.price || 0
                    })),
                    shippingAddress: formattedShippingAddress,
                    shippingStatus: "pending",
                    status: "pending",
                    deliveryStatus: "pending",
                    platformFee: (parseFloat(vendor.productTotal) / 100) * 0.1, // 10% of product amount only
                    vendorEarnings: (parseFloat(vendor.productTotal) / 100) * 0.9, // 90% of product amount only, no shipping
                    checkoutSessionId: checkoutSessionId // Add this to prevent duplicates
                };

                // Debug: Log the final mapped order products
                console.log("🎯 Final mapped order products:", {
                    originalCartItemsLength: vendorDetails?.cartItems?.length || 0,
                    mappedProductsLength: order.products.length,
                    mappedProducts: order.products,
                    orderProductsEmpty: order.products.length === 0
                });

                // Save order to Firestore
                console.log("💾 Saving order to database...");
                console.log("📝 Order details:", {
                    id: order.id,
                    vendorName: order.vendorName,
                    customerName: order.customerName,
                    subtotal: order.subtotal,
                    shippingCost: order.shippingCost,
                    amount: order.amount,
                    productsCount: order.products.length,
                    products: order.products,
                    shippingAddress: order.shippingAddress
                });
                await setDoc(doc(db, "orders", orderId), order);
                console.log("✅ Order saved:", orderId);

                // Update product inventory
                console.log("📦 Updating product inventory...");
                for (const product of order.products) {
                    try {
                        const productRef = doc(db, "products", product.productId);
                        const productDoc = await getDoc(productRef);
                        
                        if (productDoc.exists()) {
                            const productData = productDoc.data();
                            
                            // Only update inventory if tracking is enabled
                            if (productData.trackQuantity && productData.stockQuantity !== undefined) {
                                const newStock = Math.max(0, productData.stockQuantity - product.quantity);
                                await updateDoc(productRef, {
                                    stockQuantity: newStock,
                                    updatedAt: new Date()
                                });
                                console.log(`✅ Updated inventory for ${product.productName}: ${productData.stockQuantity} → ${newStock}`);
                            }
                        }
                    } catch (error) {
                        console.error(`❌ Error updating inventory for product ${product.productId}:`, error);
                        // Don't fail the entire order for inventory update errors
                    }
                }
                console.log("✅ Product inventory updated");

                // Update vendor earnings
                console.log("💰 Updating vendor earnings...");
                const vendorRef = doc(db, "vendors", vendor.vendorId);
                const vendorEarningsDoc = await getDoc(vendorRef);
                if (vendorEarningsDoc.exists()) {
                    const vendorEarningsData = vendorEarningsDoc.data();
                    const now = new Date();
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    
                    // Calculate earnings from this order
                    const orderEarnings = order.vendorEarnings || 0;
                    
                    // Update monthly earnings if last update was in a different month
                    const lastUpdate = vendorEarningsData.lastEarningsUpdate?.toDate?.() || vendorEarningsData.lastEarningsUpdate || new Date(0);
                    const monthlyEarnings = lastUpdate < monthStart ? orderEarnings : (vendorEarningsData.monthlyEarnings || 0) + orderEarnings;
                    
                    await updateDoc(vendorRef, {
                        monthlyEarnings,
                        allTimeEarnings: (vendorEarningsData.allTimeEarnings || 0) + orderEarnings,
                        lastEarningsUpdate: now
                    });
                    console.log("✅ Vendor earnings updated");
                }

                // Create shipping label
                console.log("📦 Creating shipping label...");
                const labelCreated = await createShippingLabel(order, vendorDocData);
                if (!labelCreated) {
                    console.log("⚠️ Failed to create shipping label - will need to be retried later");
                    await updateDoc(doc(db, "orders", orderId), {
                        shippingStatus: "label_failed",
                        shippingError: "Failed to create shipping label"
                    });
                }
                console.log("✅ Shipping label created for order:", orderId);
            }

            // Clear the user's entire cart after successful order creation
            console.log("\n🛒 Clearing user's cart after successful purchase...");
            try {
                const userCartRef = collection(db, "users", checkoutData.userId, "cart");
                const userCartDocs = await getDocs(userCartRef);
                
                if (!userCartDocs.empty) {
                    // Delete all cart items
                    const deletePromises = userCartDocs.docs.map(doc => deleteDoc(doc.ref));
                    await Promise.all(deletePromises);
                    console.log(`✅ Successfully cleared ${userCartDocs.docs.length} items from user's cart`);
                } else {
                    console.log("ℹ️ User's cart was already empty");
                }
            } catch (error) {
                console.error("❌ Error clearing user's cart:", error);
                // Don't fail the webhook if cart clearing fails
            }

            console.log("=== ORDER CREATION COMPLETE ===");
            
            // Clean up the processing lock
            await deleteDoc(lockRef);
            console.log("✅ Processing lock cleaned up");
            
            return NextResponse.json({ success: true });
            
            } catch (orderProcessingError) {
                console.error("❌ Error during order processing:", orderProcessingError);
                // Clean up the processing lock in case of error
                try {
                    await deleteDoc(lockRef);
                    console.log("✅ Processing lock cleaned up after error");
                } catch (lockCleanupError) {
                    console.error("❌ Error cleaning up processing lock:", lockCleanupError);
                }
                throw orderProcessingError; // Re-throw to trigger outer catch
            }
        }
        // Handle customer creation
        else if (event.type === 'customer.created') {
            const customer = eventObject as Stripe.Customer;
            console.log("Customer created:", customer.id);
        }
        // Handle successful charges
        else if (event.type === 'charge.succeeded') {
            const charge = eventObject as Stripe.Charge;
            console.log("Charge succeeded:", charge.id);
        }
        // Handle successful payment intents
        else if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = eventObject as Stripe.PaymentIntent;
            console.log("Payment intent succeeded:", paymentIntent.id);
        }
        // Handle account updates
        else if (event.type === 'account.updated') {
            const account = eventObject as Stripe.Account;
            console.log("Account updated:", account.id);
            console.log("🔍 Account status:", {
                details_submitted: account.details_submitted,
                charges_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                requirements: account.requirements?.currently_due?.length || 0,
                capabilities: account.capabilities ? Object.keys(account.capabilities) : []
            });
            
            // Check if this account has completed onboarding
            if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
                console.log("✅ Account onboarding completed, checking if vendor needs to be created");
                await handleAccountOnboardingCompleted(account);
            } else {
                console.log("⏳ Account onboarding not yet complete");
            }
        }
        // Handle capability updates
        else if (event.type === 'capability.updated') {
            const capability = eventObject as Stripe.Capability;
            console.log("Capability updated:", capability.id, "status:", capability.status);
            
            // If card_payments capability is now active, check if we need to create vendor
            if (capability.id === 'card_payments' && capability.status === 'active') {
                console.log("✅ Card payments capability activated, checking account status");
                try {
                    const accountId = typeof capability.account === 'string' ? capability.account : capability.account.id;
                    const account = await stripe.accounts.retrieve(accountId);
                    console.log("🔍 Retrieved account for card_payments capability:", {
                        id: account.id,
                        details_submitted: account.details_submitted,
                        charges_enabled: account.charges_enabled,
                        payouts_enabled: account.payouts_enabled
                    });
                    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
                        console.log("✅ Full account onboarding completed, creating vendor");
                        await handleAccountOnboardingCompleted(account);
                    } else {
                        console.log("⏳ Account not fully ready yet after card_payments activation");
                    }
                } catch (error) {
                    console.error("❌ Error retrieving account for capability update:", error);
                }
            }
            
            // If transfers capability is now active, check if we need to create vendor
            if (capability.id === 'transfers' && capability.status === 'active') {
                console.log("✅ Transfers capability activated, checking account status");
                try {
                    const accountId = typeof capability.account === 'string' ? capability.account : capability.account.id;
                    const account = await stripe.accounts.retrieve(accountId);
                    console.log("🔍 Retrieved account for transfers capability:", {
                        id: account.id,
                        details_submitted: account.details_submitted,
                        charges_enabled: account.charges_enabled,
                        payouts_enabled: account.payouts_enabled
                    });
                    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
                        console.log("✅ Full account onboarding completed, creating vendor");
                        await handleAccountOnboardingCompleted(account);
                    } else {
                        console.log("⏳ Account not fully ready yet after transfers activation");
                    }
                } catch (error) {
                    console.error("❌ Error retrieving account for capability update:", error);
                }
            }
        }
        // Handle external account creation (bank account connected)
        else if (event.type === 'account.external_account.created') {
            const externalAccount = eventObject as any;
            console.log("External account created:", externalAccount.id, "for account:", externalAccount.account);
            
            // When a bank account is connected, check if onboarding is now complete
            try {
                const accountId = externalAccount.account;
                const account = await stripe.accounts.retrieve(accountId);
                console.log("🔍 Checking account after external account creation:", {
                    id: account.id,
                    details_submitted: account.details_submitted,
                    charges_enabled: account.charges_enabled,
                    payouts_enabled: account.payouts_enabled
                });
                if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
                    console.log("✅ Account onboarding completed after external account creation");
                    await handleAccountOnboardingCompleted(account);
                }
            } catch (error) {
                console.error("❌ Error checking account after external account creation:", error);
            }
        }
        // Handle person creation (identity verification)
        else if (event.type === 'person.created') {
            const person = eventObject as any;
            console.log("Person created:", person.id, "for account:", person.account);
            // Just log for now, person creation alone doesn't complete onboarding
        }
        // Handle financial connections account creation
        else if (event.type === 'financial_connections.account.created') {
            const financialAccount = eventObject as any;
            console.log("Financial connections account created:", financialAccount.id);
            // This is related to bank account verification, but doesn't directly complete onboarding
        }
        // Log unhandled event types
        else {
            console.log(`⚠️ Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error(`❌ Error processing webhook ${event.type}:`, error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
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
