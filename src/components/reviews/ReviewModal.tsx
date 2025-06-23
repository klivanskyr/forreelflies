'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Modal from '../modal/Modal';
import ReviewForm from './ReviewForm';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'product' | 'vendor';
  targetId: string;
  targetName: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  type, 
  targetId, 
  targetName, 
  onReviewSubmitted 
}: ReviewModalProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (reviewData: any) => {
    if (!session?.user) {
      setSubmitError('You must be logged in to submit a review');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const endpoint = type === 'product' 
        ? '/api/v1/product/reviews'
        : '/api/v1/vendor/reviews';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitSuccess(true);
      onReviewSubmitted?.();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
      }, 2000);

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  };

  if (!session?.user) {
    return (
      <Modal open={isOpen} setOpen={(open) => !open && handleClose()}>
        <div className="text-center py-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Sign In Required</h3>
          <p className="text-gray-600 mb-6">
            You need to be signed in to leave a review.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} setOpen={(open) => !open && handleClose()} className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
        </div>
        
        {submitSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Review Submitted!</h3>
            <p className="text-gray-600">Thank you for your feedback. Your review will help others make informed decisions.</p>
          </div>
        ) : (
          <>
            {submitError && (
              <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                {submitError}
              </div>
            )}
            
            <ReviewForm
              type={type}
              targetId={targetId}
              targetName={targetName}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
} 