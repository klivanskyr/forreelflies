import { db } from "@/lib/firebase";
import { collection, getDocs, getDoc, query, limit, doc, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
let cachedData: { timestamp: number; data: any } | null = null;

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Check cache first
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            return NextResponse.json(cachedData.data);
        }

        // Aggregate top-selling products from orders
        const orderDocs = await getDocs(collection(db, "orders"));
        const salesMap: Record<string, { quantity: number; revenue: number }> = {};
        
        orderDocs.forEach((doc) => {
            const order = doc.data();
            if (order.products) {
                order.products.forEach((p: any) => {
                    if (!salesMap[p.productId]) {
                        salesMap[p.productId] = { quantity: 0, revenue: 0 };
                    }
                    salesMap[p.productId].quantity += (p.quantity || 0);
                    salesMap[p.productId].revenue += ((p.price || 0) * (p.quantity || 0));
                });
            }
        });

        // Get review data for all products
        const reviewsRef = collection(db, "productReviews");
        const reviewsSnapshot = await getDocs(reviewsRef);
        const reviewMap: Record<string, { totalRating: number; count: number }> = {};
        
        reviewsSnapshot.forEach((doc) => {
            const review = doc.data();
            if (!reviewMap[review.productId]) {
                reviewMap[review.productId] = { totalRating: 0, count: 0 };
            }
            reviewMap[review.productId].totalRating += review.rating;
            reviewMap[review.productId].count++;
        });

        // Calculate weighted scores for each product
        const productScores = Object.entries(salesMap).map(([productId, sales]) => {
            const reviews = reviewMap[productId] || { totalRating: 0, count: 0 };
            const avgRating = reviews.count > 0 ? reviews.totalRating / reviews.count : 0;
            
            // Weighted score formula:
            // 40% sales quantity + 30% revenue + 30% average rating
            const score = (
                (0.4 * sales.quantity) +
                (0.3 * sales.revenue) +
                (0.3 * avgRating * 20) // Multiply by 20 to normalize ratings (0-5) with other metrics
            );
            
            return { productId, score };
        });

        // Sort by score and take top 6
        const topProductIds = productScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
            .map(item => item.productId);

        let products: any[] = [];
        if (topProductIds.length > 0) {
            // Fetch product details for top sellers
            for (const productId of topProductIds) {
                const productDoc = await getDoc(doc(db, "products", productId));
                if (productDoc.exists()) {
                    const productData = productDoc.data();
                    // Only include published products
                    if (!productData.isDraft) {
                        // Add review summary
                        const reviews = reviewMap[productId] || { totalRating: 0, count: 0 };
                        const reviewSummary = {
                            averageRating: reviews.count > 0 ? reviews.totalRating / reviews.count : 0,
                            totalReviews: reviews.count
                        };
                        
                        products.push({
                            id: productDoc.id,
                            ...productData,
                            reviewSummary,
                            salesData: {
                                totalSold: salesMap[productId].quantity,
                                totalRevenue: salesMap[productId].revenue
                            }
                        });
                    }
                }
            }
        }

        // If no products found or all are drafts, fallback to top-rated published products
        if (products.length === 0) {
            const productsRef = collection(db, "products");
            const snapshot = await getDocs(
                query(
                    productsRef,
                    where("isDraft", "==", false),
                    limit(6)
                )
            );
            products = await Promise.all(
                snapshot.docs.map(async (doc) => {
                    const reviews = reviewMap[doc.id] || { totalRating: 0, count: 0 };
                    return {
                        id: doc.id,
                        ...doc.data(),
                        reviewSummary: {
                            averageRating: reviews.count > 0 ? reviews.totalRating / reviews.count : 0,
                            totalReviews: reviews.count
                        }
                    };
                })
            );
        }

        // Update cache
        const responseData = { data: products };
        cachedData = {
            timestamp: Date.now(),
            data: responseData
        };

        return NextResponse.json(responseData);
    } catch (err) {
        console.error("Failed to fetch top selling products", err);
        return NextResponse.json({ error: "Failed to fetch top selling products" }, { status: 500 });
    }
} 