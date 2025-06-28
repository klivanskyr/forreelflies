import { db } from "@/lib/firebase";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

// POST - Mark a vendor review as helpful
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, userId } = body;

    if (!reviewId || !userId) {
      return NextResponse.json({ error: "Review ID and User ID are required" }, { status: 400 });
    }

    // Check if review exists
    const reviewDoc = await getDoc(doc(db, "vendorReviews", reviewId));
    if (!reviewDoc.exists()) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // TODO: Check if user has already marked this review as helpful
    // For now, we'll allow multiple helpful votes from the same user

    // Increment helpful count
    await updateDoc(doc(db, "vendorReviews", reviewId), {
      helpful: increment(1)
    });

    return NextResponse.json({ 
      success: true,
      message: "Review marked as helpful" 
    });

  } catch (error) {
    console.error("Error marking review as helpful:", error);
    return NextResponse.json({ error: "Failed to mark review as helpful" }, { status: 500 });
  }
} 