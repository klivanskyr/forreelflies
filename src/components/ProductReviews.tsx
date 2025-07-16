'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ReviewList from './reviews/ReviewList';
import ReviewModal from './reviews/ReviewModal';
import { FaStar } from 'react-icons/fa';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { data: session } = useSession();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);

  useEffect(() => {
    if (session?.user?.uid) {
      // Add debouncing to prevent excessive calls
      const timeoutId = setTimeout(() => {
        checkIfUserHasReviewed();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [session?.user?.uid, productId]);

  const checkIfUserHasReviewed = async () => {
    if (!session?.user?.uid) return;
    
    setCheckingReview(true);
    try {
      const response = await fetch(`/api/v1/product/reviews/check?productId=${productId}&userId=${session.user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setHasReviewed(data.hasReviewed);
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    } finally {
      setCheckingReview(false);
    }
  };

  const handleReviewSubmitted = () => {
    setRefreshKey(prev => prev + 1);
    setHasReviewed(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        {session?.user && !hasReviewed && !checkingReview && (
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <FaStar className="w-4 h-4" />
            Write a Review
          </button>
        )}
        {session?.user && hasReviewed && (
          <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
            You have already reviewed this product
          </div>
        )}
        {!session?.user && (
          <div className="text-sm text-gray-600">
            <span>Sign in to write a review</span>
          </div>
        )}
      </div>

      <ReviewList
        key={refreshKey}
        type="product"
        targetId={productId}
        showSummary={true}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        type="product"
        targetId={productId}
        targetName={productName}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
} 