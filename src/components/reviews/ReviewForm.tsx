'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaStar } from 'react-icons/fa';
import { toast } from 'sonner';

interface ReviewFormProps {
  type: 'product' | 'vendor';
  targetId: string;
  targetName: string;
  onSubmit: (reviewData: any) => Promise<void>;
  isSubmitting: boolean;
}

export default function ReviewForm({ type, targetId, targetName, onSubmit, isSubmitting }: ReviewFormProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (rating === 0) newErrors.rating = 'Please select a rating';
    if (!title.trim()) newErrors.title = 'Please enter a review title';
    if (title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters';
    if (!comment.trim()) newErrors.comment = 'Please enter a review comment';
    if (comment.trim().length < 10) newErrors.comment = 'Comment must be at least 10 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      setErrors({ general: 'You must be logged in to submit a review' });
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    const reviewData = {
      [type === 'product' ? 'productId' : 'vendorId']: targetId,
      userId: session.user.uid,
      userName: session.user.name || session.user.username || 'Anonymous',
      userEmail: session.user.email || '',
      rating,
      title: title.trim(),
      comment: comment.trim(),
      images: [] // TODO: Add image upload functionality
    };

    try {
      await onSubmit(reviewData);
      // Reset form on success
      setRating(0);
      setTitle('');
      setComment('');
      setErrors({});
      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Review submission error:', error);
      const errorMessage = 'Failed to submit review. Please try again.';
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    }
  };

  const StarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="p-1 transition-colors"
        >
          <FaStar
            className={`w-6 h-6 ${
              star <= (hoverRating || rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {rating > 0 && (
          <>
            {rating} star{rating !== 1 ? 's' : ''}
            {rating === 1 && ' - Poor'}
            {rating === 2 && ' - Fair'}
            {rating === 3 && ' - Good'}
            {rating === 4 && ' - Very Good'}
            {rating === 5 && ' - Excellent'}
          </>
        )}
      </span>
    </div>
  );

  if (!session?.user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">You must be logged in to write a review.</p>
        <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Write a Review for {targetName}
        </h3>
        
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {errors.general}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating *
        </label>
        <StarRating />
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Review Title *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience..."
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title}</p>
          )}
          <p className="text-sm text-gray-500 ml-auto">{title.length}/100</p>
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review *
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience..."
          rows={5}
          maxLength={1000}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.comment && (
            <p className="text-sm text-red-600">{errors.comment}</p>
          )}
          <p className="text-sm text-gray-500 ml-auto">{comment.length}/1000</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Review Guidelines</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Be honest and fair in your review</li>
          <li>• Focus on your personal experience</li>
          <li>• Avoid inappropriate language</li>
          <li>• Don't include personal information</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
} 