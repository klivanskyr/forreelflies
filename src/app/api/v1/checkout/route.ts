import { CartItem } from "@/app/cart/page";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

import Stripe from "stripe";

// Function to validate Shippo connectivity
async function validateShippoConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
        if (!process.env.SHIPPO_KEY) {
            return { success: false, error: "Shippo API key not configured" };
        }

        // Test Shippo API with a simple request to verify connectivity
        const response = await fetch("https://api.goshippo.com/addresses/", {
            method: "GET",
            headers: {
                "Authorization": `ShippoToken ${process.env.SHIPPO_KEY}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return { success: false, error: `Shippo API error: ${response.status}` };
        }

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
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

        // Extract vendorItems from the request body
        const { vendorItems }: { vendorItems: VendorItem[] } = await request.json();

        if (!vendorItems || vendorItems.length === 0) {
            return NextResponse.json({ error: "Required field: vendorItems (array)" }, { status: 400 });
        }

        // Validate that user has required information for shipping calculation
        // Note: Stripe will collect shipping address, but we need to ensure shipping was calculated properly
        console.log("Validating checkout request for user:", user.uid);

        // Test Shippo connectivity before allowing checkout
        const shippoValidation = await validateShippoConnectivity();
        if (!shippoValidation.success) {
            return NextResponse.json({ 
                error: `Shipping service is currently unavailable: ${shippoValidation.error}. Please try again later.` 
            }, { status: 503 });
        }

        // verify the vendorItems array follows the correct structure and fetch missing stripeAccountIds
        for (const vendor of vendorItems) {
            if (!vendor.vendorId || !vendor.cartItems || vendor.shippingFee === undefined) {
                return NextResponse.json({ error: "Each vendor item must have: vendorId, cartItems, shippingFee" }, { status: 400 });
            }

            // Validate that shipping fee is not zero (indicates shipping calculation failed or wasn't performed)
            if (vendor.shippingFee <= 0) {
                return NextResponse.json({ 
                    error: `Shipping calculation required. Please ensure shipping rates are calculated before checkout for vendor ${vendor.vendorId}` 
                }, { status: 400 });
            }

            // Validate that cartItems have required shipping dimensions for Shippo integration
            for (const item of vendor.cartItems) {
                if (!item.product.shippingWeight || item.product.shippingWeight <= 0) {
                    return NextResponse.json({ 
                        error: `Product "${item.product.name}" is missing shipping weight. Please contact the vendor to update product shipping information.` 
                    }, { status: 400 });
                }
                
                // Check for basic shipping dimensions (use defaults if missing)
                if (!item.product.shippingLength) item.product.shippingLength = 6;
                if (!item.product.shippingWidth) item.product.shippingWidth = 4;  
                if (!item.product.shippingHeight) item.product.shippingHeight = 2;
            }
            
            // If stripeAccountId is missing, fetch it from the vendors collection
            if (!vendor.stripeAccountId) {
                try {
                    const vendorDoc = await getDoc(doc(db, "vendors", vendor.vendorId));
                    if (!vendorDoc.exists()) {
                        return NextResponse.json({ error: `Vendor ${vendor.vendorId} not found` }, { status: 400 });
                    }
                    
                    const vendorData = vendorDoc.data();
                    if (!vendorData.stripeAccountId) {
                        return NextResponse.json({ error: `Vendor ${vendor.vendorId} has not completed Stripe onboarding` }, { status: 400 });
                    }
                    
                    vendor.stripeAccountId = vendorData.stripeAccountId;
                } catch (error) {
                    console.error(`Error fetching vendor ${vendor.vendorId}:`, error);
                    return NextResponse.json({ error: `Failed to fetch vendor ${vendor.vendorId} information` }, { status: 500 });
                }
            }
        }

        // Generate a unique checkout session ID for storing cart data
        const checkoutSessionId = `checkout_${Date.now()}_${user.uid}`;
        
        let totalShippingfeeCents = 0;
        const lineItems: LineItem[] = [];
        const vendorDetails: VendorDetails[] = [];
        const vendorMetadata: VendorMetadata[] = [];

        // Process each vendor's items
        for (const vendor of vendorItems) {
            if (!vendor.cartItems || vendor.cartItems.length === 0) {
                return NextResponse.json({ error: `Vendor ${vendor.vendorId} has no cart items` }, { status: 400 });
            }

            if (!vendor.stripeAccountId) {
                return NextResponse.json({ error: `Vendor ${vendor.vendorId} is missing Stripe Account ID` }, { status: 400 });
            }

            let vendorTotal = 0;

            // Convert items into Stripe line items
            vendor.cartItems.forEach((item) => {
                const itemTotalCents = item.product.price * item.quantity * 100; // Convert price to cents
                lineItems.push({
                    price_data: {
                        currency: "usd",
                        product_data: { 
                            name: item.product.name ,
                            images: item.product.images,
                            description: item.product.shortDescription
                        },
                        unit_amount: itemTotalCents / item.quantity,
                    },
                    quantity: item.quantity,
                });

                vendorTotal += itemTotalCents;
            });

            // Add shipping fee to totalShippingfee
            totalShippingfeeCents += vendor.shippingFee * 100; //Convert to cents

            const vendorName = vendor.cartItems[0]?.product?.vendorName || '';

            // Store full vendor details for Firestore
            vendorDetails.push({
                vendorId: vendor.vendorId,
                stripeAccountId: vendor.stripeAccountId,
                amount: vendorTotal,
                shippingFee: vendor.shippingFee * 100, // Convert to cents for consistency
                cartItems: vendor.cartItems, // Include cart items for order creation
                vendorName: vendorName,
            });

            // Store minimal vendor metadata for Stripe (to fit in 500 char limit)
            vendorMetadata.push({
                vendorId: vendor.vendorId,
                stripeAccountId: vendor.stripeAccountId,
                amount: vendorTotal,
                shippingFee: vendor.shippingFee * 100,
                vendorName: vendorName,
            });
        }

        // Store full cart data in Firestore temporarily (expires in 1 hour)
        await setDoc(doc(db, "checkoutSessions", checkoutSessionId), {
            vendorDetails: vendorDetails,
            userId: user.uid,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        });

        // Calculate platform fee (10% of total)
        // const applicationFeeAmount = Math.round(totalAmountCents * 0.1);

        // Create a single Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            metadata: {
                vendorMetadata: JSON.stringify(vendorMetadata), // Minimal vendor data (under 500 chars)
                checkoutSessionId: checkoutSessionId, // Reference to full cart data in Firestore
                userId: user.uid, // Store the user ID for order tracking
            },
            // Collect customer information
            customer_creation: 'always',
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['US', 'CA'], // Add more countries as needed
            },
            phone_number_collection: {
                enabled: true,
            },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: "fixed_amount",
                        fixed_amount: { amount: totalShippingfeeCents, currency: "usd" }, 
                        display_name: "Multi-Vendor Shipping",
                    },
                },
            ],
            mode: "payment",
            ui_mode: "hosted",
            success_url: `${process.env.URL}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.URL}/checkout/cancel`,
        });

        console.log("session", session);

        return NextResponse.json({ data: { url: session.url }}, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
    }
}