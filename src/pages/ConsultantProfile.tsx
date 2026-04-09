import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Briefcase, DollarSign, Clock, Calendar } from 'lucide-react';
import { getAdvisorById, getConsultantReviews } from '../services/api';
import type { Consultant, Review } from '../types';
import { getInitials, formatCurrency, formatDate } from '../utils/helpers';
import StarRating from '../components/StarRating';
import ReviewForm from '../components/ReviewForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const ConsultantProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // If navigated with ?review=appointmentId, auto-open the review form
  const reviewAppointmentId = searchParams.get('review');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [cRes, rRes] = await Promise.all([
          getAdvisorById(id),
          getConsultantReviews(id),
        ]);
        setConsultant(cRes.data);
        setReviews(rRes.data);
        if (reviewAppointmentId) {
          setShowReviewForm(true);
        }
      } catch {
        setError('Failed to load consultant profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error || !consultant) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500">{error || 'Consultant not found.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-navy text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {getInitials(consultant.user?.fullName || '')}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-navy">{consultant.user?.fullName}</h1>
            <span className="inline-block px-3 py-1 bg-royal/10 text-royal text-sm rounded-full font-medium mt-1">
              {consultant.specialization}
            </span>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Briefcase size={16} />
                <span>{consultant.yearsExperience || 0} years experience</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign size={16} />
                <span>{formatCurrency(consultant.hourlyRate)}/hr</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>Joined {formatDate(consultant.createdAt)}</span>
              </div>
            </div>
            <div className="mt-3">
              <StarRating rating={consultant.averageRating} showNumber />
            </div>
          </div>
          {isAuthenticated ? (
            <Link
              to={`/book/${consultant._id}`}
              className="px-6 py-3 bg-gold text-navy font-semibold rounded-xl hover:bg-gold-dark transition-colors flex items-center gap-2"
            >
              <Calendar size={18} />
              Book Appointment
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-6 py-3 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors"
            >
              Login to Book
            </Link>
          )}
        </div>
        {consultant.bio && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-navy mb-2">About</h3>
            <p className="text-gray-600 leading-relaxed">{consultant.bio}</p>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && reviewAppointmentId && consultant && user?.role === 'client' && (
        <div className="mb-8">
          <ReviewForm
            appointmentId={reviewAppointmentId}
            consultantId={consultant._id}
            onReviewSubmitted={async () => {
              setShowReviewForm(false);
              // Reload reviews and consultant data
              const [cRes, rRes] = await Promise.all([
                getAdvisorById(id!),
                getConsultantReviews(id!),
              ]);
              setConsultant(cRes.data);
              setReviews(rRes.data);
            }}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-xl font-bold text-navy mb-6">
          Reviews ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet.</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                      {getInitials(review.client?.fullName || '')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.client?.fullName}</p>
                      <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                {review.reviewText && (
                  <p className="text-gray-600 text-sm ml-13">{review.reviewText}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantProfile;
