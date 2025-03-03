import { metadata } from "framer-motion/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * Expected request format:
 * 
 * {
 *   "rate": "eab0f0c5689347439a9b87f2380710e5",
 *   "label_file_type": "PDF",
 *   "async": false
 * }
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const headers = request.headers;

        // Validate required fields
        if (!body.rate) {
            return NextResponse.json({ error: "Missing 'rate' value" }, { status: 400 });
        }
        if (!body.label_file_type) {
            return NextResponse.json({ error: "Missing 'label_file_type' value" }, { status: 400 });
        }
        if (body.async === undefined) {
            return NextResponse.json({ error: "Missing 'async' value" }, { status: 400 });
        }

        // Extract API key from request headers
        const apiKey = headers.get("authorization");
        if (!apiKey) {
            return NextResponse.json({ error: "Missing 'Authorization' header" }, { status: 401 });
        }

        // Make a request to Shippo Transactions API
        const response = await fetch("https://api.goshippo.com/transactions", {
            method: "POST",
            headers: {
                "Authorization": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                rate: body.rate,
                label_file_type: body.label_file_type,
                async: body.async,
                shipment: body.shipment,
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            return NextResponse.json(
                { error: data },
                { status: response.status }
            );
        }

        // Return successful response
        const data = await response.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unknown error occurred" },
            { status: 500 }
        );
    }
}
