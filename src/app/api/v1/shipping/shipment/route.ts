import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import shippo, { Shipment, Parcel } from "@/lib/shippo";

type Address = {
    name: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
};

function validateAddress(address: Address | undefined): boolean {
    if (!address) return false;
    return !!(
        address.name &&
        address.street1 &&
        address.city &&
        address.state &&
        address.zip &&
        address.country
    );
}

function formatParcel(parcel: any): Parcel {
    return {
        length: String(parcel.length || "10"),
        width: String(parcel.width || "6"),
        height: String(parcel.height || "4"),
        distanceUnit: parcel.distanceUnit || "in",
        weight: String(parcel.weight || "1"),
        massUnit: parcel.massUnit || "lb"
    };
}

/**
 * Expected request format:
 * 
 * For cart shipping calculation:
 * {
 *   "addressFrom": {
 *     "name": "Sender Name",
 *     "street1": "123 Main St",
 *     "city": "Los Angeles",
 *     "state": "CA",
 *     "zip": "90001",
 *     "country": "US"
 *   },
 *   "addressTo": {
 *     "name": "Recipient Name",
 *     "street1": "456 Elm St",
 *     "city": "New York",
 *     "state": "NY",
 *     "zip": "10001",
 *     "country": "US"
 *   },
 *   "parcels": [
 *     {
 *       "length": "10",
 *       "width": "6",
 *       "height": "4",
 *       "distanceUnit": "in",
 *       "weight": "3",
 *       "massUnit": "lb"
 *     }
 *   ],
 *   "async": false
 * }
 * 
 * For order shipping label creation, add:
 * {
 *   "orderId": "order123" // Required for label creation
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    console.log("\n=== SHIPPO SHIPMENT CREATION START ===");
    const user = await requireRole(request, ["vendor", "user"]);
    if (user instanceof NextResponse) {
        console.log("❌ User authentication failed");
        return user;
    }
    console.log("✅ User authenticated:", user.uid);

    try {
        const body = await request.json();
        
        // Validate required fields for both scenarios
        if (!body.addressFrom || !body.addressTo || !body.parcels) {
            console.log("❌ Missing required fields:", {
                addressFrom: !body.addressFrom,
                addressTo: !body.addressTo,
                parcels: !body.parcels
            });
            return NextResponse.json({ 
                error: 'Missing required fields',
                details: {
                    addressFrom: !body.addressFrom ? 'Missing addressFrom' : undefined,
                    addressTo: !body.addressTo ? 'Missing addressTo' : undefined,
                    parcels: !body.parcels ? 'Missing parcels' : undefined
                }
            }, { status: 400 });
        }

        // Format parcels to match Shippo's requirements
        const formattedParcels = Array.isArray(body.parcels) 
            ? body.parcels.map(formatParcel)
            : [formatParcel(body.parcels)];

        // Create shipment using new SDK pattern
        const shipment = await shippo.shipments.create({
            addressFrom: body.addressFrom,
            addressTo: body.addressTo,
            parcels: formattedParcels,
            async: false
        });

        if (!shipment) {
            console.log("❌ Failed to create shipment");
            return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
        }

        if (!shipment.rates || shipment.rates.length === 0) {
            console.log("❌ No shipping rates available");
            return NextResponse.json({ error: 'No shipping rates available' }, { status: 404 });
        }

        console.log("✅ Shippo shipment created");
        console.log("Shipment ID:", shipment.object_id);
        console.log("Available rates:", shipment.rates.length);

        // If orderId is provided, update the order with shipping info
        if (body.orderId) {
            console.log("\n💾 Updating order with shipment information...");
            try {
                const orderDoc = await getDoc(doc(db, "orders", body.orderId));
                if (!orderDoc.exists()) {
                    console.log("❌ Order not found:", body.orderId);
                    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
                }

                await updateDoc(doc(db, "orders", body.orderId), {
                    shipmentId: shipment.object_id,
                    shippingStatus: "ready_for_purchase",
                    availableRates: shipment.rates
                });
                console.log("✅ Order updated with shipment details");
            } catch (error) {
                console.error("❌ Error updating order:", error);
                // Don't fail the request if order update fails, just log it
                // The shipping rates are still valid and useful
            }
        }

        console.log("=== SHIPPO SHIPMENT CREATION COMPLETE ===\n");
        
        // Return only the rates array instead of the entire shipment object
        return NextResponse.json(shipment.rates);
    } catch (error) {
        console.error("❌ Error creating shipment:", error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
