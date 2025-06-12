import { tokenToUser } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // tokenToUser will read the cookie itself
        const user = await tokenToUser();
        if (!user) {
            // Remove the invalid token cookie
            const res = NextResponse.json({ error: "Invalid token", user: null }, { status: 401 });
            res.cookies.set("token", "", { maxAge: 0, path: "/" });
            return res;
        }
        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
            return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
        }
    }
}