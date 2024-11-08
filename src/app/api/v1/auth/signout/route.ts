import { auth } from "@/lib/firebase";
import { getIdToken, signInWithEmailAndPassword } from "firebase/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const token = request.cookies.get("token");

       if (!token) {
            console.log("SERVER ERROR: No token provided");
            return NextResponse.json({ error: "No token provided" }, { status: 401 });
        }

       const ret = NextResponse.json({ message: "Successfully signed out" }, { status: 200 });
        ret.cookies.set("token", "", {
            httpOnly: true,
            maxAge: 0,
            sameSite: "strict",
        });
        console.log("SERVER SUCCESS: Successfully signed out");
        return ret;
        
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
