import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// GET - Check if user has already reviewed a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");

    if (!productId || !userId) {
      return NextResponse.json({ error: "Product ID and User ID are required" }, { status: 400 });
    }

    // Check if user has already reviewed this product
    const existingReviewQuery = query(
      collection(db, "productReviews"),
      where("productId", "==", productId),
      where("userId", "==", userId)
    );
    const existingReviewSnapshot = await getDocs(existingReviewQuery);

    return NextResponse.json({
      hasReviewed: !existingReviewSnapshot.empty,
      reviewId: existingReviewSnapshot.empty ? null : existingReviewSnapshot.docs[0].id
    });

  } catch (error) {
    console.error("Error checking if user has reviewed product:", error);
    return NextResponse.json({ error: "Failed to check review status" }, { status: 500 });
  }
} 