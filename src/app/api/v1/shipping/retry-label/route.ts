import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
    const user = await requireRole(request, "vendor");
    if (user instanceof NextResponse) return user;

    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        // Get the order
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (!orderDoc.exists()) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const orderData = orderDoc.data();
        
        // Verify the order belongs to this vendor
        if (orderData.vendorId !== user.uid) {
            return NextResponse.json({ error: "Order does not belong to this vendor" }, { status: 403 });
        }

        // Check if order already has a shipping label
        if (orderData.shippoLabelUrl) {
            return NextResponse.json({ error: "Order already has a shipping label" }, { status: 400 });
        }

        // Get vendor data for shipping
        const vendorDoc = await getDoc(doc(db, "vendors", user.uid));
        if (!vendorDoc.exists()) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        const vendorData = vendorDoc.data();

        // Validate vendor address
        if (!vendorData?.storeStreetAddress || !vendorData?.storeCity || !vendorData?.storeState || !vendorData?.storeZip) {
            return NextResponse.json({ 
                error: `Vendor address is incomplete. Missing: ${[
                    !vendorData?.storeStreetAddress && 'street',
                    !vendorData?.storeCity && 'city', 
                    !vendorData?.storeState && 'state',
                    !vendorData?.storeZip && 'zip'
                ].filter(Boolean).join(', ')}` 
            }, { status: 400 });
        }

        // Validate customer address
        if (!orderData.shippingAddress?.street || !orderData.shippingAddress?.city || 
            !orderData.shippingAddress?.state || !orderData.shippingAddress?.zip) {
            return NextResponse.json({ 
                error: `Customer address is incomplete. Missing: ${[
                    !orderData.shippingAddress?.street && 'street',
                    !orderData.shippingAddress?.city && 'city',
                    !orderData.shippingAddress?.state && 'state', 
                    !orderData.shippingAddress?.zip && 'zip'
                ].filter(Boolean).join(', ')}` 
            }, { status: 400 });
        }

        // Prepare addresses
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

        const address_to = {
            name: orderData.shippingAddress.name || 'Customer',
            street1: orderData.shippingAddress.street,
            city: orderData.shippingAddress.city,
            state: orderData.shippingAddress.state,
            zip: orderData.shippingAddress.zip,
            country: orderData.shippingAddress.country || 'US',
        };

        // Calculate parcel dimensions from products
        const products = orderData.products || [];
        const totalWeight = products.reduce((sum: number, p: any) => sum + (p.quantity * 1), 0); // Default 1 lb per item
        
        const parcels = [{
            length: "6",
            width: "4", 
            height: "2",
            distance_unit: "in",
            weight: Math.max(totalWeight, 0.1).toString(),
            mass_unit: "lb",
        }];

        // Create shipment
        const shipmentPayload = {
            address_from,
            address_to,
            parcels,
            async: false,
            extra: {
                reference_1: orderId,
                reference_2: `Vendor: ${vendorData.storeName}`,
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
            throw new Error(`Failed to create Shippo shipment: ${errorText}`);
        }

        const shipmentData = await shipmentRes.json();
        const rates = shipmentData.rates;
        
        if (!rates || !rates.length) {
            throw new Error("No shipping rates available");
        }

        // Pick the cheapest rate
        const cheapestRate = rates.reduce((min: any, r: any) => 
            parseFloat(r.amount) < parseFloat(min.amount) ? r : min, rates[0]
        );

        // Purchase label
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
            throw new Error(`Failed to purchase shipping label: ${errorText}`);
        }

        const transactionData = await transactionRes.json();

        // Update order with shipping info
        await updateDoc(doc(db, "orders", orderId), {
            shippoLabelUrl: transactionData.label_url,
            trackingNumber: transactionData.tracking_number,
            shippingStatus: "label_created",
            shippoTransactionId: transactionData.object_id,
            shippoShipmentId: shipmentData.object_id,
            shippingCarrier: cheapestRate.provider,
            shippingService: cheapestRate.servicelevel.name,
            shippingCostActual: parseFloat(cheapestRate.amount),
            shippingError: null, // Clear any previous errors
        });

        return NextResponse.json({ 
            success: true,
            labelUrl: transactionData.label_url,
            trackingNumber: transactionData.tracking_number,
            carrier: cheapestRate.provider,
            service: cheapestRate.servicelevel.name,
            cost: cheapestRate.amount
        }, { status: 200 });

    } catch (error) {
        console.error("Error retrying shipping label creation:", error);
        
        // Update order with error info
        if (request.json && (await request.json()).orderId) {
            try {
                await updateDoc(doc(db, "orders", (await request.json()).orderId), {
                    shippingStatus: "label_failed",
                    shippingError: error instanceof Error ? error.message : "Unknown error",
                });
            } catch (updateError) {
                console.error("Failed to update order with error:", updateError);
            }
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 