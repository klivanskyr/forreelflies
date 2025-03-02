import { NextRequest, NextResponse } from "next/server";
/**
 * Expected request format:
 * 
 * {
 *   "address_from": {
 *     "name": "Sender Name",
 *     "street1": "123 Main St",
 *     "city": "Los Angeles",
 *     "state": "CA",
 *     "zip": "90001",
 *     "country": "US"
 *   },
 *   "address_to": {
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
 *       "distance_unit": "in",
 *       "weight": "3",
 *       "mass_unit": "lb"
 *     }
 *   ],
 *   "async": false
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.address_from) {
            return NextResponse.json({ error: "Missing 'address_from' object" }, { status: 400 });
        }
        if (!body.address_to) {
            return NextResponse.json({ error: "Missing 'address_to' object" }, { status: 400 });
        }
        if (!body.parcels || !Array.isArray(body.parcels) || body.parcels.length === 0) {
            return NextResponse.json({ error: "'parcels' must be a non-empty array" }, { status: 400 });
        }

        // Validate address structure
        const requiredAddressFields = ["name", "street1", "city", "state", "zip", "country"];
        for (const field of requiredAddressFields) {
            if (!body.address_from[field]) {
                return NextResponse.json({ error: `Missing '${field}' in 'address_from'` }, { status: 400 });
            }
            if (!body.address_to[field]) {
                return NextResponse.json({ error: `Missing '${field}' in 'address_to'` }, { status: 400 });
            }
        }

        // Validate parcel structure
        for (const parcel of body.parcels) {
            const requiredParcelFields = ["length", "width", "height", "distance_unit", "weight", "mass_unit"];
            for (const field of requiredParcelFields) {
                if (!parcel[field]) {
                    return NextResponse.json({ error: `Missing '${field}' in parcel object` }, { status: 400 });
                }
            }
        }

        // Fetch Shippo API
        const response = await fetch("https://api.goshippo.com/shipments/", {
            method: "POST",
            headers: {
                "Authorization": `ShippoToken ${process.env.SHIPPO_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: "Failed fetching from goshippo shipments" + error },
                { status: response.status }
            );
        }

        // Return successful response
        const data = await response.json();
        return NextResponse.json(data.rates, { status: 200 });

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unknown error occurred" },
            { status: 500 }
        );
    }
}
