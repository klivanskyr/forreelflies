import { db } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";
import shippo from "@/lib/shippo";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get("uid");

        if (!uid) {
            console.log("SERVER ERROR: uid param is required");
            return NextResponse.json({ error: "uid param is required" }, { status: 400 });
        }

        try {
            const _ = await adminAuth.getUser(uid);

            const userDoc = await getDoc(doc(db, "users", uid));
            if (!userDoc.exists()) {
                console.log("SERVER ERROR: User not found");
                return NextResponse.json({ error: "User not found" }, { status: 400 });
            }

            const userDb = userDoc.data();
            console.log("SERVER SUCCESS: Successfully fetched user");
            return NextResponse.json({ user: { uid, ...userDb, vendorSignUpStatus: userDb?.vendorSignUpStatus ?? "notStarted" } }, { status: 200 });
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
                    vendorSignUpStatus: "notStarted", // Default status
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

            if (!signInResponse.ok) {
                console.log("SERVER ERROR: Successfully created user but could not sign in");
                return NextResponse.json({ error: "Successfully created user but could not sign in" }, { status: 400 });
            }

            // Get the Set-Cookie header from the sign-in response
            const setCookie = signInResponse.headers.get('Set-Cookie');
            if (!setCookie) {
                console.log("SERVER ERROR: No auth token received from sign in");
                return NextResponse.json({ error: "No auth token received from sign in" }, { status: 400 });
            }

            // Create the response with success message
            const res = NextResponse.json({ message: "Successfully created user and signed in" }, { status: 200 });
            
            // Set the cookie with the same parameters as the sign-in endpoint
            const tokenMatch = setCookie.match(/token=([^;]+)/);
            if (tokenMatch) {
                res.cookies.set("token", tokenMatch[1], {
                    httpOnly: true,
                    sameSite: "strict",
                });
            }
            
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
    console.log("PUT /api/v1/user called");
    console.log("Request cookies:", request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 20)}...`));
    
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) {
        console.log("requireRole returned NextResponse (auth failed)");
        return user;
    }

    console.log("User authenticated:", { uid: user.uid, email: user.email });

    try {
        const { uid, streetAddress, city, state, zipCode, country } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "uid is required" }, { status: 400 });
        }

        // Verify that the authenticated user matches the uid being updated
        if (user.uid !== uid) {
            return NextResponse.json({ error: "Unauthorized: Cannot update another user's data" }, { status: 401 });
        }
        
        // Verify address
        async function validateAddress(streetAddress: string, city: string, state: string, zipCode: string, country: string) {
            try {
                const address = await shippo.addresses.create({
                    street1: streetAddress,
                    city: city,
                    state: state,
                    zip: zipCode,
                    country: country,
                    validate: true
                });

                if (address.validationResults && address.validationResults.isValid) {
                    return address;
                } else {
                    console.log("Invalid Address", address.validationResults || address);
                    throw new Error("Invalid address");
                }
            } catch (error) {
                console.error("Address validation error:", error);
                return null;
            }
        }

        // Validate address (optional - fallback to user input if validation fails)
        let validateStreetAddress = streetAddress;
        let validateCity = city;
        let validateState = state;
        let validateZipCode = zipCode;
        let validateCountry = country;

        try {
            const validatedData = await validateAddress(streetAddress, city, state, zipCode, country);
            if (validatedData) {
                // Use validated address if available
                validateStreetAddress = validatedData.street1;
                validateCity = validatedData.city;
                validateState = validatedData.state;
                validateZipCode = validatedData.zip;
                validateCountry = validatedData.country;
                console.log("Using validated address from Shippo");
            } else {
                console.log("Shippo validation failed, using user input");
            }
        } catch (error) {
            console.error("Address validation error:", error);
            console.log("Falling back to user input address");
            // Continue with user input - don't block the save
        }

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
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;

    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get("uid");

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