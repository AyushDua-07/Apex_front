import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { createReview } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  appointmentId: string;
  consultantId: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

const ReviewForm: React.FC<Props> = ({ appointmentId, consultantId, onReviewSubmitted, onCancel }) => {
  const { addToast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      addToast('error', 'Please select a rating.');
      return;
    }
    setSubmitting(true);
    try {
      await createReview({ appointmentId, consultantId, rating, reviewText });
      addToast('success', 'Review submitted! Thank you.');
      onReviewSubmitted();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit review.';
      addToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-navy mb-4">Write a Review</h3>

      {/* Star Rating Input */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={`${
                  star <= (hoverRating || rating)
                    ? 'text-gold fill-gold'
                    : 'text-gray-300'
                } transition-colors`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-500 self-center">
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
            </span>
          )}
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Your Review (optional)</p>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Share your experience with this consultant..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{reviewText.length}/1000</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="flex-1 py-2.5 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ReviewForm;
