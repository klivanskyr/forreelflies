import { CartItem } from "@/app/cart/page";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Stripe from "stripe";
import shippo from "@/lib/shippo";

// Function to validate Shippo connectivity
async function validateShippoConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
        // Test Shippo API with a simple request to verify connectivity
        await shippo.addresses.list(1);
        return { success: true };
    } catch (error) {
        console.error("Shippo connectivity test failed:", error);
        return { success: false, error: "Failed to connect to shipping service" };
    }
}

export type VendorItem = {
    vendorId: string;
    stripeAccountId: string;
    cartItems: CartItem[];
    shippingFee: number;
};

type LineItem = {
    price_data: {
        currency: string;
        product_data: {
            name: string;
            images: string[] | undefined;
            description: string | undefined;
        };
        unit_amount: number;
    };
    quantity: number;
};

// Minimal vendor details for Stripe metadata (under 500 chars)
type VendorMetadata = {
    vendorId: string;
    stripeAccountId: string;
    amount: number;
    shippingFee: number;
    vendorName: string;
};

// Full vendor details for Firestore storage
type VendorDetails = {
    vendorId: string;
    stripeAccountId: string;
    amount: number;
    shippingFee: number;
    cartItems: CartItem[];
    vendorName: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log("\n=== CHECKOUT SESSION CREATION START ===");
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) {
        console.log("❌ User authentication failed");
        return user;
    }
    console.log("✅ User authenticated:", user.uid);

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

        // Extract vendorItems from the request body
        const { vendorItems }: { vendorItems: VendorItem[] } = await request.json();
        console.log("📦 Processing checkout for vendors:", vendorItems.map(v => v.vendorId).join(", "));

        if (!vendorItems || vendorItems.length === 0) {
            console.log("❌ No vendor items provided");
            return NextResponse.json({ error: "Required field: vendorItems (array)" }, { status: 400 });
        }

        // Validate Shippo connectivity
        console.log("🚢 Validating Shippo connectivity...");
        const shippoValidation = await validateShippoConnectivity();
        if (!shippoValidation.success) {
            console.log("❌ Shippo validation failed:", shippoValidation.error);
            return NextResponse.json({ 
                error: `Shipping service is currently unavailable: ${shippoValidation.error}. Please try again later.` 
            }, { status: 503 });
        }
        console.log("✅ Shippo connectivity validated");

        // Validate vendors and fetch Stripe accounts
        console.log("🔍 Validating vendors and fetching Stripe accounts...");
        for (const vendor of vendorItems) {
            console.log(`\n📋 Processing vendor: ${vendor.vendorId}`);
            
            // If stripeAccountId is missing, fetch it from the vendors collection
            if (!vendor.stripeAccountId) {
                console.log("ℹ️ No Stripe account ID provided, fetching from database...");
                try {
                    const vendorDoc = await getDoc(doc(db, "vendors", vendor.vendorId));
                    if (!vendorDoc.exists()) {
                        console.log("❌ Vendor document not found");
                        return NextResponse.json({ error: `Vendor ${vendor.vendorId} not found` }, { status: 400 });
                    }
                    
                    const vendorData = vendorDoc.data();
                    if (!vendorData.stripeAccountId) {
                        console.log("❌ Vendor has not completed Stripe onboarding");
                        return NextResponse.json({ error: `Vendor ${vendor.vendorId} has not completed Stripe onboarding` }, { status: 400 });
                    }
                    
                    vendor.stripeAccountId = vendorData.stripeAccountId;
                    console.log("✅ Found Stripe account ID:", vendor.stripeAccountId);
                } catch (error) {
                    console.error(`❌ Error fetching vendor ${vendor.vendorId}:`, error);
                    return NextResponse.json({ error: `Failed to fetch vendor ${vendor.vendorId} information` }, { status: 500 });
                }
            }
        }

        // Generate checkout session ID and prepare data
        console.log("\n🔄 Preparing checkout session data...");
        const checkoutSessionId = `checkout_${Date.now()}_${user.uid}`;
        console.log("📝 Checkout session ID:", checkoutSessionId);
        
        let totalShippingfeeCents = 0;
        const lineItems: LineItem[] = [];
        const vendorDetails: VendorDetails[] = [];
        const vendorMetadata: VendorMetadata[] = [];

        // Process each vendor's items
        for (const vendor of vendorItems) {
            console.log(`\n🛍️ Processing items for vendor: ${vendor.vendorId}`);
            let vendorTotal = 0;
            let vendorName = "Unknown Vendor";

            // Calculate vendor totals and prepare line items
            for (const item of vendor.cartItems) {
                const amountCents = Math.round(item.product.price * 100);
                vendorTotal += amountCents * item.quantity;
                
                console.log(`📦 Adding item: ${item.product.name}`);
                console.log(`   Quantity: ${item.quantity}`);
                console.log(`   Price: $${item.product.price}`);
                
                lineItems.push({
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: item.product.name,
                            images: item.product.images || [],
                            description: item.product.shortDescription || undefined
                        },
                        unit_amount: amountCents,
                    },
                    quantity: item.quantity,
                });
            }

            // Add shipping fee to total (but don't add as line item)
            if (vendor.shippingFee) {
                console.log(`📦 Adding shipping fee: $${vendor.shippingFee}`);
                const shippingFeeCents = Math.round(vendor.shippingFee * 100);
                totalShippingfeeCents += shippingFeeCents;
                vendorTotal += shippingFeeCents;  // Add shipping fee to vendor total
            }

            // Store vendor details
            vendorDetails.push({
                vendorId: vendor.vendorId,
                stripeAccountId: vendor.stripeAccountId,
                cartItems: vendor.cartItems,
                amount: vendorTotal,  // Now includes shipping fee
                shippingFee: vendor.shippingFee,
                vendorName,
            });

            console.log(`💰 Vendor subtotal: $${(vendorTotal - Math.round(vendor.shippingFee * 100))/100}`);
            console.log(`💰 Vendor shipping: $${vendor.shippingFee}`);
            console.log(`💰 Vendor total: $${vendorTotal/100}`);
            
            // Store minimal vendor metadata
            vendorMetadata.push({
                vendorId: vendor.vendorId,
                stripeAccountId: vendor.stripeAccountId,
                amount: vendorTotal,  // Now includes shipping fee
                shippingFee: Math.round(vendor.shippingFee * 100),  // Store in cents
                vendorName,
            });
        }

        // Store cart data in Firestore
        console.log("\n💾 Storing checkout session data in Firestore...");
        await setDoc(doc(db, "checkoutSessions", checkoutSessionId), {
            vendorDetails: vendorDetails,
            userId: user.uid,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        });
        console.log("✅ Checkout session data stored");

        // Create Stripe Checkout Session
        console.log("\n💳 Creating Stripe checkout session...");
        const session = await stripe.checkout.sessions.create({
            customer_email: user.email || undefined,
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_URL}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
            metadata: {
                userId: user.uid,
                checkoutSessionId,
                vendorData: JSON.stringify(vendorMetadata),
            },
            payment_intent_data: {
                metadata: {
                    userId: user.uid,
                    checkoutSessionId,
                },
            },
            shipping_address_collection: {
                allowed_countries: ['US'],
            },
            billing_address_collection: 'required',
            phone_number_collection: {
                enabled: true
            },
            customer_creation: 'always',
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: totalShippingfeeCents,
                            currency: 'usd',
                        },
                        display_name: 'Standard Shipping',
                    },
                },
            ],
            automatic_tax: { enabled: false },
            allow_promotion_codes: false,
            submit_type: 'pay',
            payment_method_types: ['card'],
            locale: 'en',
        });

        console.log("✅ Stripe checkout session created");
        console.log("Session ID:", session.id);
        console.log("Checkout URL:", session.url);
        console.log("Shipping Collection:", session.shipping_address_collection ? "Enabled" : "Disabled");
        console.log("Billing Collection:", session.billing_address_collection);
        console.log("Phone Collection:", session.phone_number_collection?.enabled);
        console.log("=== CHECKOUT SESSION CREATION COMPLETE ===\n");

        return NextResponse.json({ 
            data: {
                url: session.url,
                clientSecret: session.client_secret,
                checkoutSessionId: session.id
            }
        });

    } catch (error) {
        console.error("❌ Error creating checkout session:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}