import { db } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { cp } from "fs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const uid = request.nextUrl.searchParams.get("uid");

        if (!uid) {
            console.log("SERVER ERROR: uid param is required");
            return NextResponse.json({ error: "uid param is required" }, { status: 400 });
        }

        try {
            const user = await adminAuth.getUser(uid);
            console.log("SERVER SUCCESS: Successfully fetched user");
            return NextResponse.json({ user }, { status: 200 });
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

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "email and password are required" }, { status: 400 });
        }

        try {
            // Add user to Firebase Auth
            const userRecord = await adminAuth.createUser({
                email,
                password,
            });

            try {
                // Add user to Firestore
                await setDoc(doc(db, "users", userRecord.uid), {
                    username: email.split("@")[0],
                    email,
                    isVendor: false
                });
            } catch (error) {
                // Delete user from Firebase Auth if Firestore fails
                await adminAuth.deleteUser(userRecord.uid);
                if (error instanceof Error) {
                    return NextResponse.json({ error: error.message }, { status: 400 });
                } else {
                    return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
                }
            }

            return NextResponse.json({ message: "Successfully created user" }, { status: 200 });
        } catch (error) {
            if (error instanceof Error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            } else {
                return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
            }
        }

    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const { uid, email, password } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "uid is required" }, { status: 400 });
        }

        try {
            // await adminAuth.updateUser(uid, {
            //     ...(email && { email }),
            //     ...(password && { password }),
            // });
            return NextResponse.json({ message: "PUT REQUEST NOT ALLOWED" }, { status: 400 });
            // return NextResponse.json({ message: "Successfully updated user" }, { status: 200 });
        } catch (error) {
            if (error instanceof Error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            } else {
                return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
            }
        }

    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const uid = request.nextUrl.searchParams.get("uid");

        if (!uid) {
            return NextResponse.json({ error: "uid param is required" }, { status: 400 });
        }

        try {
            // await adminAuth.deleteUser(uid);
            return NextResponse.json({ message: "DELETION NOT ALLOWED" }, { status: 400 });
        } catch (error) {
            if (error instanceof Error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            } else {
                return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
            }
        }

    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}