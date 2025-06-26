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

    try {
        const { orderId } = await request.json();
        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        // Get order details
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (!orderDoc.exists()) {
            console.error("❌ Order not found:", orderId);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        const order = { id: orderDoc.id, ...orderDoc.data() } as Order;

        // Get vendor data
        const vendorDoc = await getDoc(doc(db, "vendors", order.vendorId));
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
        if (!order.shippingAddress?.street1 || !order.shippingAddress?.city || 
            !order.shippingAddress?.state || !order.shippingAddress?.zip) {
            return NextResponse.json({ 
                error: `Customer address is incomplete. Missing: ${[
                    !order.shippingAddress?.street1 && 'street',
                    !order.shippingAddress?.city && 'city',
                    !order.shippingAddress?.state && 'state', 
                    !order.shippingAddress?.zip && 'zip'
                ].filter(Boolean).join(', ')}` 
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
            street1: order.shippingAddress.street1,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zip: order.shippingAddress.zip,
            country: order.shippingAddress.country || 'US',
        };

        // Calculate parcel dimensions from products
        const products = order.products || [];
        const totalWeight = products.reduce((sum: number, p: any) => sum + (p.quantity * 1), 0); // Default 1 lb per item
        
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
                reference1: order.id,
                reference2: `Vendor: ${vendorData.storeName}`,
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

        // Update order with shipping info
        if (!order.id) {
            throw new Error("Order ID is required");
        }

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

        return NextResponse.json({ 
            success: true,
            labelUrl: transaction.labelUrl,
            trackingNumber: transaction.trackingNumber,
            carrier: cheapestRate.provider,
            service: cheapestRate.servicelevel.name,
            cost: cheapestRate.amount
        }, { status: 200 });

    } catch (error) {
        console.error("Error retrying label:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Unknown error" 
        }, { status: 500 });
    }
} 