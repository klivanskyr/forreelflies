'use client';

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import { ProductReview, VendorReview } from "@/app/types/types";
import { FaStar } from "react-icons/fa";

type Review = (ProductReview | VendorReview) & {
    status: 'Published' | 'Pending' | 'Hidden';
};

type ReviewStats = {
    averageRating: number;
    totalReviews: number;
    published: number;
    pending: number;
    hidden: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
};

function ReviewsContent() {
    const ProductQuickStartGuide = dynamic(() => import("@/components/storeManagerHelpers/ProductQuickStartGuide"), { ssr: false });

    const { data: session } = useSession();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats>({
        averageRating: 0,
        totalReviews: 0,
        published: 0,
        pending: 0,
        hidden: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const showTour = searchParams.get('tour') === '1';

    useEffect(() => {
        if (session?.user?.uid) {
            // Add debouncing to prevent excessive calls
            const timeoutId = setTimeout(() => {
                fetchReviews();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [session?.user?.uid]);

    useEffect(() => {
        if (showTour) {
            router.prefetch && router.prefetch('/store-manager/payments?tour=1');
        }
    }, [showTour, router]);

    // When tour finishes, go to payments page with tour param
    const handleTourFinish = () => {
        router.push('/store-manager/payments?tour=1');
    };

    const fetchReviews = async () => {
        try {
            setLoading(true);
            // Fetch product reviews
            const productRes = await fetch('/api/v1/product/reviews?vendorId=' + session?.user?.uid);
            const productData = await productRes.json();
            const productReviews = productData.reviews.map((review: ProductReview) => ({
                ...review,
                status: 'Published' as const
            }));

            // Fetch vendor reviews
            const vendorRes = await fetch('/api/v1/vendor/reviews?vendorId=' + session?.user?.uid);
            const vendorData = await vendorRes.json();
            const vendorReviews = vendorData.reviews.map((review: VendorReview) => ({
                ...review,
                status: 'Published' as const
            }));

            // Combine and sort reviews by date
    // (hooks are already declared at the top-level, remove from here)
            const allReviews = [...productReviews, ...vendorReviews].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setReviews(allReviews);

            // Calculate stats
            const totalReviews = allReviews.length;
            const published = allReviews.filter(r => r.status === 'Published').length;
            const pending = allReviews.filter(r => r.status === 'Pending').length;
            const hidden = allReviews.filter(r => r.status === 'Hidden').length;
            const averageRating = totalReviews > 0 
                ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
                : 0;
            const ratingDistribution = {
                1: allReviews.filter(r => r.rating === 1).length,
                2: allReviews.filter(r => r.rating === 2).length,
                3: allReviews.filter(r => r.rating === 3).length,
                4: allReviews.filter(r => r.rating === 4).length,
                5: allReviews.filter(r => r.rating === 5).length,
            };

            setStats({
                averageRating,
                totalReviews,
                published,
                pending,
                hidden,
                ratingDistribution
            });

        } catch (err) {
            setError('Failed to fetch reviews');
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (reviewId: string, newStatus: 'Published' | 'Hidden') => {
        try {
            const response = await fetch(`/api/v1/reviews/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId, status: newStatus })
            });

            if (response.ok) {
                // Update local state
                setReviews(prevReviews => 
                    prevReviews.map(review => 
                        review.id === reviewId 
                            ? { ...review, status: newStatus }
                            : review
                    )
                );
                // Refresh stats
                fetchReviews();
            } else {
                throw new Error('Failed to update review status');
            }
        } catch (err) {
            console.error('Error updating review status:', err);
            // Show error to user (you could add a toast notification here)
        }
    };

    const handleRespond = async (reviewId: string, response: string) => {
        try {
            const apiResponse = await fetch(`/api/v1/reviews/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId, response })
            });

            if (apiResponse.ok) {
                // Update local state or refresh reviews
                fetchReviews();
            } else {
                throw new Error('Failed to submit response');
            }
        } catch (err) {
            console.error('Error responding to review:', err);
            // Show error to user
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Published': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Hidden': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredReviews = reviews
        .filter(review => selectedFilter === 'All' || review.status === selectedFilter)
        .filter(review => {
            if (!searchQuery) return true;
            const searchLower = searchQuery.toLowerCase();
            return (
                review.userName.toLowerCase().includes(searchLower) ||
                ('productName' in review && review.productName.toLowerCase().includes(searchLower)) ||
                review.comment.toLowerCase().includes(searchLower)
            );
        });

    if (loading) {
        return (
            <StoreManagerTemplate>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl">Loading reviews...</div>
                </div>
            </StoreManagerTemplate>
        );
    }

    if (error) {
        return (
            <StoreManagerTemplate>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-red-600">{error}</div>
                </div>
            </StoreManagerTemplate>
        );
    }

    return (
        <StoreManagerTemplate>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
                    <button className="bg-greenPrimary text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                        Export Reviews
                    </button>
                </div>

                {/* Review Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded">
                                <FaStar className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                                <div className="flex items-center">
                                    <p className="text-2xl font-semibold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                                    <div className="ml-2">
                                        {renderStars(Math.round(stats.averageRating))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.totalReviews}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Published</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.published}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rating Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                    <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                            const percentage = (count / stats.totalReviews) * 100 || 0;
                            return (
                                <div key={rating} className="flex items-center">
                                    <div className="flex items-center w-20">
                                        <span className="text-sm font-medium text-gray-900">{rating}</span>
                                        <FaStar className="w-4 h-4 text-yellow-400 ml-1" />
                                    </div>
                                    <div className="flex-1 mx-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-yellow-400 h-2 rounded-full" 
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-600 w-12">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search reviews by customer or product..."
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                            />
                        </div>
                        <select 
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-greenPrimary focus:border-transparent"
                        >
                            <option>All</option>
                            <option>Published</option>
                            <option>Pending</option>
                            <option>Hidden</option>
                        </select>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                    {filteredReviews.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                            No reviews found
                        </div>
                    ) : (
                        filteredReviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h3 className="font-medium text-gray-900">{review.userName}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {'productName' in review ? review.productName : 'Vendor Review'}
                                                </p>
                                            </div>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(review.status)}`}>
                                                {review.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center mb-2">
                                            {renderStars(review.rating)}
                                            <span className="ml-2 text-sm text-gray-600">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="mb-4">
                                            <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                                            <p className="text-gray-700">{review.comment}</p>
                                        </div>
                                        <div className="flex space-x-3">
                                            {review.status === 'Pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleStatusChange(review.id, 'Published')}
                                                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                    >
                                                        Publish
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(review.id, 'Hidden')}
                                                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        Hide
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => handleRespond(review.id, '')}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                            >
                                                Respond
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </StoreManagerTemplate>
    );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greenPrimary"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ReviewsContent />
        </Suspense>
    );
}