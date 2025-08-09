import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import shippo from "@/lib/shippo";
import type { Parcel } from "shippo";
import { Order } from "@/app/types/types";

export async function POST(request: NextRequest) {
    const user = await requireRole(request, ["vendor", "user"]);
    if (user instanceof NextResponse) return user;

    let order: Order | null = null;

    try {
        const { orderId } = await request.json();
        console.log("🔍 Retry label request for orderId:", orderId);
        
        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        // Get order details
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (!orderDoc.exists()) {
            console.error("❌ Order not found:", orderId);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        order = { id: orderDoc.id, ...orderDoc.data() } as Order;
        console.log("📦 Order data:", {
            id: order.id,
            vendorId: order.vendorId,
            shippingStatus: order.shippingStatus,
            hasShippingAddress: !!order.shippingAddress,
            customerEmail: order.customerEmail
        });

        // Get vendor data
        const vendorDoc = await getDoc(doc(db, "vendors", order.vendorId));
        if (!vendorDoc.exists()) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }
        const vendorData = vendorDoc.data();
        console.log("🏪 Vendor data:", {
            storeName: vendorData.storeName,
            hasStreetAddress: !!vendorData.storeStreetAddress,
            storeCity: vendorData.storeCity,
            storeState: vendorData.storeState,
            storeZip: vendorData.storeZip
        });

        // Check if vendor has complete address information
        const missingVendorFields = [];
        if (!vendorData.storeStreetAddress) missingVendorFields.push('street address');
        if (!vendorData.storeCity) missingVendorFields.push('city');
        if (!vendorData.storeState) missingVendorFields.push('state');
        if (!vendorData.storeZip) missingVendorFields.push('zip code');

        if (missingVendorFields.length > 0) {
            const errorMessage = `Vendor address is incomplete. Missing: ${missingVendorFields.join(', ')}. Please update your store address in the store manager settings.`;
            console.error("❌", errorMessage);
            
            // Update order with error
            if (order.id) {
                await updateDoc(doc(db, "orders", order.id), {
                    shippingStatus: "label_failed",
                    shippingError: errorMessage
                });
            }
            
            return NextResponse.json({ 
                error: errorMessage,
                details: "Please complete your vendor address information in the store manager settings before creating shipping labels."
            }, { status: 400 });
        }

        // Check if customer has complete address information
        const missingCustomerFields = [];
        if (!order.shippingAddress?.address1) missingCustomerFields.push('street address');
        if (!order.shippingAddress?.city) missingCustomerFields.push('city');
        if (!order.shippingAddress?.state) missingCustomerFields.push('state');
        if (!order.shippingAddress?.zip) missingCustomerFields.push('zip code');

        if (missingCustomerFields.length > 0) {
            const errorMessage = `Customer address is incomplete. Missing: ${missingCustomerFields.join(', ')}.`;
            console.error("❌", errorMessage);
            
            // Update order with error
            if (order.id) {
                await updateDoc(doc(db, "orders", order.id), {
                    shippingStatus: "label_failed",
                    shippingError: errorMessage
                });
            }
            
            return NextResponse.json({ 
                error: errorMessage,
                details: "Customer address information is incomplete. Please contact the customer to provide complete shipping address."
            }, { status: 400 });
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
            street1: order.shippingAddress.address1,
            street2: order.shippingAddress.address2 || '',
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zip: order.shippingAddress.zip,
            country: order.shippingAddress.country || 'US',
        };

        // Calculate parcel dimensions from order products
        const products = order.products || [];
        const totalWeight = products.reduce((sum: number, product: any) => sum + (product.quantity * 1), 0); // Default 1 lb per item
        
        const parcels: Parcel[] = [{
            length: "6",
            width: "4", 
            height: "2",
            distanceUnit: "in",
            weight: Math.max(totalWeight, 0.1).toString(),
            massUnit: "lb"
        }];

        // Create shipment using SDK
        const shipment = await shippo.shipments.create({
            addressFrom,
            addressTo,
            parcels,
            async: false,
            extra: {
                reference1: (order.id || '').substring(0, 50),
                reference2: `Vendor: ${vendorData.storeName}`.substring(0, 50),
            }
        });

        if (!shipment.rates?.length) {
            throw new Error("No shipping rates available");
        }

        // Pick the cheapest rate
        const cheapestRate = shipment.rates.reduce((min, r) => 
            parseFloat(r.amount) < parseFloat(min.amount) ? r : min, shipment.rates[0]
        );

        // Purchase label using SDK
        const transaction = await shippo.transactions.create({
            rate: cheapestRate.objectId,
            labelFileType: "PDF",
            async: false
        });

        console.log("🔍 Transaction response:", {
            objectId: transaction.objectId,
            status: transaction.status,
            labelUrl: transaction.labelUrl,
            trackingNumber: transaction.trackingNumber,
            messages: transaction.messages || [],
            rate: transaction.rate
        });

        // Validate transaction response
        if (!transaction || !transaction.objectId) {
            throw new Error("Failed to create transaction - no transaction object returned");
        }

        // Check if transaction has errors
        if (transaction.messages && transaction.messages.length > 0) {
            // Filter out informational messages and only treat actual errors
            const errorMessages = transaction.messages
                .filter((msg: any) => msg.code && msg.code.startsWith('ERROR'))
                .map((msg: any) => msg.text);
            
            if (errorMessages.length > 0) {
                const errorText = errorMessages.join(', ');
                throw new Error(`Transaction creation failed: ${errorText}`);
            }
            
            // Log informational messages but don't treat them as errors
            const infoMessages = transaction.messages
                .filter((msg: any) => !msg.code || !msg.code.startsWith('ERROR'))
                .map((msg: any) => msg.text);
            
            if (infoMessages.length > 0) {
                console.log("ℹ️ Transaction informational messages:", infoMessages.join(', '));
            }
        }

        // Check if transaction status indicates failure
        if (transaction.status === 'ERROR') {
            throw new Error(`Transaction failed with status: ${transaction.status}`);
        }

        // With async: false, Shippo should return the label URL and tracking number immediately
        // If they're not available, something went wrong
        if (!transaction.labelUrl || !transaction.trackingNumber) {
            console.error("❌ Transaction successful but missing label URL or tracking number:", {
                labelUrl: transaction.labelUrl,
                trackingNumber: transaction.trackingNumber,
                status: transaction.status,
                messages: transaction.messages || []
            });
            throw new Error("Transaction successful but label URL or tracking number not available. This should not happen with async: false.");
        }

        // Update order with shipping info
        if (!order?.id) {
            throw new Error("Order ID is required");
        }

        console.log("💾 Updating order with shipping info:", {
            orderId: order.id,
            labelUrl: transaction.labelUrl,
            trackingNumber: transaction.trackingNumber,
            carrier: cheapestRate.provider,
            service: cheapestRate.servicelevel.name,
            cost: cheapestRate.amount,
            transactionStatus: transaction.status
        });

        await updateDoc(doc(db, "orders", order.id), {
            shippoLabelUrl: transaction.labelUrl,
            trackingNumber: transaction.trackingNumber,
            shippingStatus: "label_created",
            shippoTransactionId: transaction.objectId,
            shippoShipmentId: shipment.objectId,
            shippingCarrier: cheapestRate.provider,
            shippingService: cheapestRate.servicelevel.name,
            shippingCostActual: parseFloat(cheapestRate.amount),
            shippingError: null, // Clear any previous errors
        });

        console.log("✅ Order updated successfully with shipping label");

        // Return response with the actual label data
        const response = {
            success: true,
            labelUrl: transaction.labelUrl,
            trackingNumber: transaction.trackingNumber,
            carrier: cheapestRate.provider,
            service: cheapestRate.servicelevel.name,
            cost: cheapestRate.amount,
            transactionStatus: transaction.status,
            message: "Label created successfully"
        };

        console.log("📤 Returning response:", response);

        return NextResponse.json(response, { status: 200 });

    } catch (error) {
        console.error("Error retrying label:", error);
        
        // Update order with error details
        if (order?.id) {
            await updateDoc(doc(db, "orders", order.id), {
                shippingStatus: "label_failed",
                shippingError: error instanceof Error ? error.message : "Unknown error occurred"
            });
        }
        
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Unknown error",
            details: "Shipping label creation failed. Please check vendor and customer address information."
        }, { status: 500 });
    }
} 