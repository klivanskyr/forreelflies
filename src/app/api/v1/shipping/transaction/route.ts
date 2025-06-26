import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import shippo from "@/lib/shippo";

/**
 * Expected request format:
 * 
 * {
 *   "rate": "eab0f0c5689347439a9b87f2380710e5",
 *   "labelFileType": "PDF",
 *   "async": false
 * }
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.rate) {
            return NextResponse.json({ error: "Missing 'rate' value" }, { status: 400 });
        }
        if (!body.labelFileType) {
            return NextResponse.json({ error: "Missing 'labelFileType' value" }, { status: 400 });
        }
        if (body.async === undefined) {
            return NextResponse.json({ error: "Missing 'async' value" }, { status: 400 });
        }

        // Create transaction using SDK
        const transaction = await shippo.transactions.create({
            rate: body.rate,
            labelFileType: body.labelFileType,
            async: body.async,
            shipment: body.shipment,
        });

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Error creating transaction:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
