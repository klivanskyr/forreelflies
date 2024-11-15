import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const bearerToken = request.headers.get("Authorization");

        if (!bearerToken) {
            console.log("SERVER ERROR: No token provided");
            return NextResponse.json({ error: "No token provided" }, { status: 401 });
        }

        try {
            const token = bearerToken.split("Bearer ")[1];
            const validUser = await adminAuth.verifyIdToken(token, true);
            console.log("SERVER SUCCESS: Successfully validated token");
            return NextResponse.json({ uid: validUser.uid }, { status: 200 });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes("auth/id-token-expired")) {
                    console.log("SERVER ERROR: Token expired");
                    const res = NextResponse.json({ message: "Token expired" }, { status: 401 });
                    res.cookies.set("token", "", { expires: new Date(0) });
                    return res;
                } else {
                    console.log(`SERVER ERROR: ${error.message}`);
                    return NextResponse.json({ error: error.message }, { status: 400 });
                }
            } else {
                console.log(`SERVER ERROR: An error occurred: ${error}`);
                return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            console.log(`SERVER ERROR: ${error.message}`);
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            console.log(`SERVER ERROR: An error occurred: ${error}`);
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}