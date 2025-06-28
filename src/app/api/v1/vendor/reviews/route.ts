import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { VendorReview, ReviewSummary } from "@/app/types/types";

// GET - Fetch reviews for a vendor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
    }

    // Fetch reviews for the vendor
    const reviewsQuery = query(
      collection(db, "vendorReviews"),
      where("vendorId", "==", vendorId),
      orderBy("createdAt", "desc")
    );

    const reviewsSnapshot = await getDocs(reviewsQuery);
    const allReviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as VendorReview[];

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedReviews = allReviews.slice(startIndex, endIndex);

    // Calculate review summary
    const reviewSummary: ReviewSummary = {
      averageRating: allReviews.length > 0 ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length : 0,
      totalReviews: allReviews.length,
      ratingDistribution: {
        1: allReviews.filter(r => r.rating === 1).length,
        2: allReviews.filter(r => r.rating === 2).length,
        3: allReviews.filter(r => r.rating === 3).length,
        4: allReviews.filter(r => r.rating === 4).length,
        5: allReviews.filter(r => r.rating === 5).length,
      }
    };

    return NextResponse.json({
      reviews: paginatedReviews,
      summary: reviewSummary,
      pagination: {
        page,
        pageSize,
        totalItems: allReviews.length,
        totalPages: Math.ceil(allReviews.length / pageSize)
      }
    });

  } catch (error) {
    console.error("Error fetching vendor reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST - Create a new vendor review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, userId, userName, userEmail, rating, title, comment, images } = body;

    // Validate required fields
    if (!vendorId || !userId || !userName || !userEmail || !rating || !title || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Check if user has already reviewed this vendor
    const existingReviewQuery = query(
      collection(db, "vendorReviews"),
      where("vendorId", "==", vendorId),
      where("userId", "==", userId)
    );
    const existingReviewSnapshot = await getDocs(existingReviewQuery);

    if (!existingReviewSnapshot.empty) {
      return NextResponse.json({ error: "You have already reviewed this vendor" }, { status: 400 });
    }

    // Get vendor details
    const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
    if (!vendorDoc.exists()) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    const vendorData = vendorDoc.data();

    // TODO: Check if user has purchased from this vendor (verified review)
    // For now, we'll mark all reviews as unverified
    const verified = false;

    // Create the review
    const review: Omit<VendorReview, 'id'> = {
      vendorId,
      vendorName: vendorData.storeName || vendorData.ownerName,
      userId,
      userName,
      userEmail,
      rating,
      title,
      comment,
      images: images || [],
      verified,
      helpful: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const reviewRef = await addDoc(collection(db, "vendorReviews"), review);

    // Update vendor's review summary
    await updateVendorReviewSummary(vendorId);

    return NextResponse.json({ 
      success: true, 
      reviewId: reviewRef.id,
      message: "Review submitted successfully" 
    });

  } catch (error) {
    console.error("Error creating vendor review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

// Helper function to update vendor review summary
async function updateVendorReviewSummary(vendorId: string) {
  try {
    const reviewsQuery = query(
      collection(db, "vendorReviews"),
      where("vendorId", "==", vendorId)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => doc.data());

    if (reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      const ratingDistribution = {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length,
      };

      const reviewSummary: ReviewSummary = {
        averageRating,
        totalReviews: reviews.length,
        ratingDistribution
      };

      // Update the vendor document
      await updateDoc(doc(db, "vendors", vendorId), {
        reviewSummary
      });
    }
  } catch (error) {
    console.error("Error updating vendor review summary:", error);
  }
} 