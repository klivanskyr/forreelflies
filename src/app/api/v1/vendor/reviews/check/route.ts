import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// GET - Check if user has already reviewed a vendor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const userId = searchParams.get("userId");

    if (!vendorId || !userId) {
      return NextResponse.json({ error: "Vendor ID and User ID are required" }, { status: 400 });
    }

    // Check if user has already reviewed this vendor
    const existingReviewQuery = query(
      collection(db, "vendorReviews"),
      where("vendorId", "==", vendorId),
      where("userId", "==", userId)
    );
    const existingReviewSnapshot = await getDocs(existingReviewQuery);

    return NextResponse.json({
      hasReviewed: !existingReviewSnapshot.empty,
      reviewId: existingReviewSnapshot.empty ? null : existingReviewSnapshot.docs[0].id
    });

  } catch (error) {
    console.error("Error checking if user has reviewed vendor:", error);
    return NextResponse.json({ error: "Failed to check review status" }, { status: 500 });
  }
} 