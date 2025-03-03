import { db } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers'

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const uid = request.nextUrl.searchParams.get("uid");

        if (!uid) {
            console.log("SERVER ERROR: uid param is required");
            return NextResponse.json({ error: "uid param is required" }, { status: 400 });
        }

        try {
            const user = await adminAuth.getUser(uid);

            const userDoc = await getDoc(doc(db, "users", uid));
            if (!userDoc.exists()) {
                console.log("SERVER ERROR: User not found");
                return NextResponse.json({ error: "User not found" }, { status: 400 });
            }

            const userDb = userDoc.data();
            console.log("SERVER SUCCESS: Successfully fetched user");
            return NextResponse.json({ user: { uid, ...userDb } }, { status: 200 });
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

            // Attempt to sign in user
            const signInResponse = await fetch(`${process.env.API_URL}/auth/signin`, {
                method: "POST",
                body: JSON.stringify({ email, password }),
                headers: {
                    "Content-Type": "application/json"
                },
            });

            // check to see if token was set
            const setCookie = signInResponse.headers.get('Set-Cookie');
            const token = setCookie?.split('=')[1].split(';')[0];

            if (!token) {
                console.log("SERVER ERROR: Successfully created user but could not sign in");
                return NextResponse.json({ error: "Successfully created user but could not sign in" }, { status: 400 });
            }

            const res = NextResponse.json({ message: "Successfully created user and signed in" }, { status: 200 });
            res.cookies.set({
                name: 'token',
                value: token,
                httpOnly: true,
            })
            return res;
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
        const { uid, streetAddress, city, state, zipCode, country } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "uid is required" }, { status: 400 });
        }

        // Check auth by seeing if the user calling this function is the same as the uid provided
        const cookies = request.cookies;
        const auth = cookies.get("token")?.value;

        // check auth with adminAuth
        try {
            await adminAuth.verifyIdToken(auth as string);
        } catch (error) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        // Verify address
        async function validateAddress(streetAddress: string, city: string, state: string, zipCode: string, country: string) {
            const response = await fetch(`https://api.goshippo.com/addresses/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `ShippoToken ${process.env.SHIPPO_KEY}`,
                },
                body: JSON.stringify({
                    "street1": streetAddress,
                    "city": city,
                    "state": state,
                    "zip": zipCode,
                    "country": country,
                    validate: true
                })
            });
        
            const data = await response.json();
            console.log(data);
            if (data.validation_results.is_valid) {
                return data; // Validated address
            } else {
                console.log("Invalid Address", data.validation_results);
                return null;
            }
        }

        // Validate address
        const validatedData = await validateAddress(streetAddress, city, state, zipCode, country);
        if (!validatedData) {
            return NextResponse.json({ error: "Invalid address" }, { status: 400 });
        }

        const validateStreetAddress = validatedData.street1;
        const validateCity = validatedData.city;
        const validateState = validatedData.state;
        const validateZipCode = validatedData.zip;
        const validateCountry = validatedData.country;

        try {
            // Update user in Firestore
            await setDoc(doc(db, "users", uid), {
                streetAddress: validateStreetAddress,
                city: validateCity,
                state: validateState,
                zipCode: validateZipCode,
                country: validateCountry
            }, { merge: true });

            return NextResponse.json({ message: "Successfully updated user" }, { status: 200 });
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