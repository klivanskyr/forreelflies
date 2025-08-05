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
            const res = NextResponse.json({ 
                message: "Successfully created user and signed in",
                uid: userRecord.uid,
                userId: userRecord.uid
            }, { status: 200 });
            
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
    const user = await requireRole(request, "user");
    if (user instanceof NextResponse) return user;

    try {
        const { uid, username, email, phoneNumber, photoURL, streetAddress, city, state, zipCode, country } = await request.json();

        if (!uid) {
            return NextResponse.json({ error: "uid is required" }, { status: 400 });
        }

        // Verify that the authenticated user matches the uid being updated
        if (user.uid !== uid) {
            return NextResponse.json({ error: "Unauthorized: Cannot update another user's data" }, { status: 401 });
        }

        // Prepare update data
        const updateData: any = {};
        
        // Add profile fields if provided
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (photoURL !== undefined) updateData.photoURL = photoURL;

        // Add address fields if provided
        if (streetAddress !== undefined) updateData.streetAddress = streetAddress;
        if (city !== undefined) updateData.city = city;
        if (state !== undefined) updateData.state = state;
        if (zipCode !== undefined) updateData.zipCode = zipCode;
        if (country !== undefined) updateData.country = country;

        // If email is being updated, update it in Firebase Auth as well
        if (email && email !== user.email) {
            try {
                await adminAuth.updateUser(uid, { email });
            } catch (error) {
                return NextResponse.json({ 
                    error: "Failed to update email. It may already be in use." 
                }, { status: 400 });
            }
        }

        // Update user in Firestore
        await setDoc(doc(db, "users", uid), updateData, { merge: true });

        return NextResponse.json({ 
            message: "Successfully updated user",
            user: { uid, ...updateData }
        }, { status: 200 });

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