import { tokenToUser } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest): Promise<NextResponse> {
    try {
        const user = await tokenToUser();
        if (!user) {
            return NextResponse.json({ error: "Invalid token", user: null }, { status: 401 });
        }

        return NextResponse.json({ user: user }, { status: 200 });

    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
            return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
        }
    }

}