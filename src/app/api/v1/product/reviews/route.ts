import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";
import { ProductReview, ReviewSummary } from "@/app/types/types";

// GET - Fetch reviews for a product or vendor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const vendorId = searchParams.get("vendorId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    if (!productId && !vendorId) {
      return NextResponse.json({ error: "Either Product ID or Vendor ID is required" }, { status: 400 });
    }

    // Build the query based on the provided parameter
    const constraints = [];
    
    // If productId is provided, filter by productId
    if (productId) {
      constraints.push(where("productId", "==", productId));
    }
    
    // If vendorId is provided, get reviews for all products by this vendor
    if (vendorId) {
      constraints.push(where("vendorId", "==", vendorId));
    }
    
    constraints.push(orderBy("createdAt", "desc"));
    
    const reviewsQuery = query(
      collection(db, "productReviews"),
      ...constraints
    );

    const reviewsSnapshot = await getDocs(reviewsQuery);
    const allReviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as ProductReview[];

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
    console.error("Error fetching product reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST - Create a new product review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userId, userName, userEmail, rating, title, comment, images } = body;

    // Validate required fields
    if (!productId || !userId || !userName || !userEmail || !rating || !title || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Check if user has already reviewed this product
    const existingReviewQuery = query(
      collection(db, "productReviews"),
      where("productId", "==", productId),
      where("userId", "==", userId)
    );
    const existingReviewSnapshot = await getDocs(existingReviewQuery);

    if (!existingReviewSnapshot.empty) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    // Get product details
    const productDoc = await getDoc(doc(db, "products", productId));
    if (!productDoc.exists()) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const productData = productDoc.data();

    // TODO: Check if user has purchased this product (verified review)
    // For now, we'll mark all reviews as unverified
    const verified = false;

    // Create the review
    const review: Omit<ProductReview, 'id'> = {
      productId,
      productName: productData.name,
      vendorId: productData.vendorId,
      vendorName: productData.vendorName,
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

    const reviewRef = await addDoc(collection(db, "productReviews"), review);

    // Update product's review summary
    await updateProductReviewSummary(productId);

    return NextResponse.json({ 
      success: true, 
      reviewId: reviewRef.id,
      message: "Review submitted successfully" 
    });

  } catch (error) {
    console.error("Error creating product review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

// Helper function to update product review summary
async function updateProductReviewSummary(productId: string) {
  try {
    const reviewsQuery = query(
      collection(db, "productReviews"),
      where("productId", "==", productId)
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

      // Update the product document
      await updateDoc(doc(db, "products", productId), {
        reviewSummary
      });
    }
  } catch (error) {
    console.error("Error updating product review summary:", error);
  }
} 