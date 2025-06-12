import { auth } from "@/lib/firebase";
import { getIdToken, signInWithEmailAndPassword } from "firebase/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            console.log("SERVER ERROR: email and password are required");
            return NextResponse.json({ error: "email and password are required" }, { status: 400 });
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await getIdToken(userCredential.user);

            const ret = NextResponse.json({ message: "Successfully signed in" }, { status: 200 });
            ret.cookies.set("token", token, {
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7,
                expires: 60 * 60 * 24 * 7,
                sameSite: "strict",
            });
            console.log("SERVER SUCCESS: Successfully signed in");
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
