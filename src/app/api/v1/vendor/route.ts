import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Order } from "@/app/types/types";
import { requireRole } from "@/app/api/utils/withRole";
import { requireAdmin } from "@/app/api/utils/adminAuth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get("vendorId");
        const userId = searchParams.get("userId");
        const pageSize = searchParams.get("pageSize");
        const page = searchParams.get("page");

        // If no specific vendor is requested, check if admin and fetch all vendors
        if (!vendorId && !userId) {
            try {
                // Check if this is an admin request
                const adminAuth = await requireAdmin(request);
                if (adminAuth instanceof NextResponse) {
                    // Not an admin, return the original error
                    console.log("SERVER ERROR: Requires at least of the the following Params: { vendorId: string, userId: string }");
                    return NextResponse.json({ message: "Requires at least of the the following Params: { vendorId: string, userId: string }" }, { status: 400 });
                }

                // Admin request - fetch all vendors
                console.log("Admin authenticated, fetching all vendors...");
                const vendorsCollection = collection(db, "vendors");
                const snapshot = await getDocs(vendorsCollection);
                
                let vendors = snapshot.docs.map(doc => {
                    const vendor = doc.data();
                    return {
                        ...vendor,
                        id: doc.id,
                        ownerId: undefined,
                        ownerName: undefined,
                    };
                });

                console.log(`Found ${vendors.length} vendors in database`);

                // Apply pagination if requested
                const limit = pageSize ? parseInt(pageSize) : vendors.length;
                const currentPage = page ? parseInt(page) : 1;
                const startIndex = (currentPage - 1) * limit;
                const endIndex = startIndex + limit;
                
                const paginatedVendors = vendors.slice(startIndex, endIndex);
                
                return NextResponse.json({ 
                    data: paginatedVendors,
                    pagination: {
                        currentPage,
                        totalPages: Math.ceil(vendors.length / limit),
                        totalCount: vendors.length,
                        pageSize: limit
                    }
                }, { status: 200 });
                
            } catch (adminError) {
                // If admin check fails, return the original error
                console.log("SERVER ERROR: Admin auth failed:", adminError);
                console.log("SERVER ERROR: Requires at least of the the following Params: { vendorId: string, userId: string }");
                return NextResponse.json({ message: "Requires at least of the the following Params: { vendorId: string, userId: string }" }, { status: 400 });
            }
        }

        if (vendorId) {
            const vendorDoc = await getDoc(doc(db, "vendors", vendorId));

            if (!vendorDoc.exists()) {
                console.log("SERVER ERROR: Vendor not found");
                return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
            }

            const vendor = vendorDoc.data();

            // Remove ownerId and ownerName from the response
            const cleanedVendor = {
                ...vendor,
                id: vendorDoc.id,
                ownerId: undefined,
                ownerName: undefined,
            }

            return NextResponse.json({ vendor: cleanedVendor }, { status: 200 });
        } else if (userId) {
            const vendorDoc = await getDoc(doc(db, "vendors", userId));

            if (!vendorDoc.exists()) {
                console.log("SERVER ERROR: Vendor not found");
                return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
            }

            const vendor = vendorDoc.data();

            // Remove ownerId and ownerName from the response
            const cleanedVendor = {
                ...vendor,
                id: vendorDoc.id,
                ownerId: undefined,
                ownerName: undefined,
            }

            return NextResponse.json({ vendor: cleanedVendor }, { status: 200 });
        } else {
            return NextResponse.json({ message: "Invalid parameters" }, { status: 400 });
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

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  // Remove the withdraw endpoint handling since it's now in its own file
  // ... existing code ...
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const user = await requireRole(request, "vendor");
  if (user instanceof NextResponse) return user;
  try {
    const { vendorId, bannerImageUrl, profileImageUrl, bio, socialLinks } = await request.json();
    if (!vendorId || vendorId !== user.uid) {
      return NextResponse.json({ error: "vendorId required and must match authenticated user" }, { status: 400 });
    }
    const updateData: any = {};
    if (bannerImageUrl !== undefined) updateData.bannerImageUrl = bannerImageUrl;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
    if (bio !== undefined) updateData.bio = bio;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    await updateDoc(doc(db, "vendors", vendorId), updateData);
    return NextResponse.json({ message: "Vendor profile updated" }, { status: 200 });
  } catch (err) {
    console.error("Vendor profile update error", err);
    return NextResponse.json({ error: "Vendor profile update failed" }, { status: 500 });
  }
}