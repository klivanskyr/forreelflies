'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaStar, FaStarHalfAlt, FaRegStar, FaThumbsUp, FaUser } from 'react-icons/fa';
import { ProductReview, VendorReview, ReviewSummary } from '@/app/types/types';
import Image from 'next/image';
import { toast } from 'sonner';

interface ReviewListProps {
  type: 'product' | 'vendor';
  targetId: string;
  showSummary?: boolean;
  maxReviews?: number;
}

const StarRating = ({ rating, size = "sm" }: { rating: number, size?: "sm" | "lg" }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  const starSize = size === "lg" ? "w-5 h-5" : "w-4 h-4";
  
  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} className={`${starSize} text-yellow-400`} />);
  }
  
  if (hasHalfStar) {
    stars.push(<FaStarHalfAlt key="half" className={`${starSize} text-yellow-400`} />);
  }
  
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<FaRegStar key={`empty-${i}`} className={`${starSize} text-gray-300`} />);
  }
  
  return <div className="flex items-center gap-1">{stars}</div>;
};

const RatingDistribution = ({ summary }: { summary: ReviewSummary }) => {
  const total = summary.totalReviews;
  
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = summary.ratingDistribution[stars as keyof typeof summary.ratingDistribution];
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={stars} className="flex items-center gap-2 text-sm">
            <span className="w-8">{stars} ★</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-gray-600">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

const ReviewCard = ({ review, type }: { review: ProductReview | VendorReview, type: 'product' | 'vendor' }) => {
  const { data: session } = useSession();
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleHelpfulClick = async () => {
    if (isSubmitting || !session?.user?.uid) {
      if (!session?.user?.uid) {
        toast.error('Please sign in to mark reviews as helpful');
      }
      return;
    }
    
    setIsSubmitting(true);
    try {
      const endpoint = type === 'product' 
        ? '/api/v1/product/reviews/helpful'
        : '/api/v1/vendor/reviews/helpful';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review.id,
          userId: session.user.uid
        }),
      });

      if (response.ok) {
        setIsHelpful(true);
        setHelpfulCount(prev => prev + 1);
        toast.success('Thank you for your feedback!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to mark review as helpful');
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark review as helpful';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <FaUser className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{review.userName}</span>
              {review.verified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} />
              <span className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
      <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>
      
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-4">
          {review.images.slice(0, 3).map((image, idx) => (
            <div key={idx} className="relative w-16 h-16">
              <Image
                src={image}
                alt={`Review image ${idx + 1}`}
                fill
                className="object-cover rounded-lg border"
                sizes="64px"
              />
            </div>
          ))}
          {review.images.length > 3 && (
            <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-600">
              +{review.images.length - 3}
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-4 text-sm">
        {session?.user ? (
          <button
            onClick={handleHelpfulClick}
            disabled={isHelpful || isSubmitting}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
              isHelpful 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
            }`}
          >
            <FaThumbsUp className="w-3 h-3" />
            <span>
              {isSubmitting ? 'Submitting...' : `Helpful (${helpfulCount})`}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1 text-gray-500 text-sm">
            <FaThumbsUp className="w-3 h-3" />
            <span>Helpful ({helpfulCount})</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ReviewList({ type, targetId, showSummary = true, maxReviews }: ReviewListProps) {
  const [reviews, setReviews] = useState<(ProductReview | VendorReview)[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [targetId, type]);

  const fetchReviews = async (pageNum = 1) => {
    try {
      setLoading(true);
      const endpoint = type === 'product' 
        ? `/api/v1/product/reviews?productId=${targetId}&page=${pageNum}&pageSize=${maxReviews || 10}`
        : `/api/v1/vendor/reviews?vendorId=${targetId}&page=${pageNum}&pageSize=${maxReviews || 10}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch reviews');
      }
      
      const data = await response.json();
      
      if (pageNum === 1) {
        setReviews(data.reviews);
      } else {
        setReviews(prev => [...prev, ...data.reviews]);
      }
      
      setSummary(data.summary);
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reviews';
      console.error('Error fetching reviews:', err);
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchReviews(page + 1);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-16 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchReviews()}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">No reviews yet</p>
        <p className="text-sm text-gray-400">Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showSummary && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {summary.averageRating.toFixed(1)}
              </div>
              <StarRating rating={summary.averageRating} size="lg" />
              <p className="text-sm text-gray-600 mt-2">
                Based on {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Rating Distribution */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Rating Breakdown</h4>
              <RatingDistribution summary={summary} />
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">
          Customer Reviews ({summary.totalReviews})
        </h3>
        
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} type={type} />
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Reviews'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 