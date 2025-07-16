import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/utils/adminAuth";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { uid, name, storeName, storeSlug, storeEmail, storePhone, storeDescription, storeStreetAddress, storeCity, storeZip, storeCountry, storeState } = await request.json();

        if (!uid || !name || !storeName || !storeSlug || !storeEmail || !storePhone || !storeDescription || !storeStreetAddress || !storeCity || !storeZip || !storeCountry || !storeState) {
            console.log("SERVER ERROR: Required Fields: { uid: string, name: string, storeName: string, storeSlug: string, storeEmail: string, storePhone: string, storeDescription: string, storeStreetAddress: string, storeCity: string, storeZip: string, storeCountry: string, storeState: string }");
            return NextResponse.json({ message: "Required Fields: { uid: string, name: string, storeName: string, storeSlug: string, storeEmail: string, storePhone: string, storeDescription: string, storeStreetAddress: string, storeCity: string, storeZip: string, storeCountry: string, storeState: string }" }, { status: 400 });
        }

        try {
            // Check if vendorRequest already exists
            const vendorRequestDoc = await getDoc(doc(db, "vendorRequests", uid));

            if (vendorRequestDoc.exists()) {
                console.log("SERVER ERROR: Vendor request already exists");
                return NextResponse.json({ message: "Vendor request already exists" }, { status: 400 });
            }

            await setDoc(doc(db, "vendorRequests", uid), {
                isApproved: false,
                name,
                storeName,
                storeSlug,
                storeEmail,
                storePhone,
                storeDescription,
                storeStreetAddress,
                storeCity,
                storeZip,
                storeCountry,
                storeState,
                createdAt: new Date().toISOString(),
            });

            // Update user vendorSignUpStatus to 'submittedApprovalForm'
            const userDocRef = doc(db, "users", uid);
            await setDoc(userDocRef, { vendorSignUpStatus: "submittedApprovalForm" }, { merge: true });
            console.log("Vendor request submitted successfully");

            return NextResponse.json({ message: "Successfully submitted vendor request" }, { status: 200 });
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

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Check if user is authenticated as admin for viewing vendor requests
        const adminAuth = await requireAdmin(request);
        if (adminAuth instanceof NextResponse) return adminAuth;

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const nameSearch = searchParams.get('name') || '';
        const storeNameSearch = searchParams.get('storeName') || '';

        // Get all documents first
        const snapshot = await getDocs(collection(db, "vendorRequests"));
        let allRequests = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as any[];

        // Apply search filters
        if (nameSearch) {
            allRequests = allRequests.filter(req => 
                req.name?.toLowerCase().includes(nameSearch.toLowerCase())
            );
        }

        if (storeNameSearch) {
            allRequests = allRequests.filter(req => 
                req.storeName?.toLowerCase().includes(storeNameSearch.toLowerCase())
            );
        }

        // Calculate pagination
        const totalCount = allRequests.length;
        const totalPages = Math.ceil(totalCount / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRequests = allRequests.slice(startIndex, endIndex);

        return NextResponse.json({ 
            requests: paginatedRequests,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
    try {
        // Check if user is authenticated as admin for denying vendor requests
        const adminAuth = await requireAdmin(request);
        if (adminAuth instanceof NextResponse) return adminAuth;

        const { uid } = await request.json();
        if (!uid) {
            return NextResponse.json({ error: "uid required" }, { status: 400 });
        }
        // Update vendor request status
        await setDoc(doc(db, "vendorRequests", uid), { isApproved: false, denied: true }, { merge: true });
        // Update user status
        await setDoc(doc(db, "users", uid), { vendorSignUpStatus: "approvalFormRejected" }, { merge: true });
        return NextResponse.json({ message: "Vendor request denied" }, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}