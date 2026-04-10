import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Video, MessageSquare, AlertCircle, CreditCard } from 'lucide-react';
import { getAdvisorById, getAdvisorAvailability, createAppointment, getMySubscription } from '../services/api';
import type { Consultant, Availability, ClientSubscription } from '../types';
import { formatCurrency, formatTime, getInitials, getUploadUrl } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const BookAppointment: React.FC = () => {
  const { consultantId } = useParams<{ consultantId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [sessionType, setSessionType] = useState<'video_call' | 'chat'>('video_call');
  const [subscription, setSubscription] = useState<ClientSubscription | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    const load = async () => {
      if (!consultantId) return;
      try {
        const [cRes, aRes] = await Promise.all([
          getAdvisorById(consultantId),
          getAdvisorAvailability(consultantId),
        ]);
        setConsultant(cRes.data);
        setSlots(aRes.data);

        // Check client subscription
        if (user?.role === 'client') {
          try {
            const subRes = await getMySubscription();
            setHasSubscription(subRes.data.hasSubscription);
            if (subRes.data.hasSubscription) {
              setSubscription(subRes.data.subscription);
            }
          } catch {
            setHasSubscription(false);
          }
        } else {
          setHasSubscription(true); // non-clients don't need subscription check
        }
      } catch {
        addToast('error', 'Failed to load booking information.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [consultantId, addToast, user]);

  const uniqueDates = [...new Set(slots.map((s) => s.availableDate))].sort();
  const filteredSlots = slots.filter((s) => s.availableDate === selectedDate);

  const handleBook = async () => {
    if (!selectedSlot || !consultant) return;
    setBooking(true);
    try {
      await createAppointment({
        consultantId: consultant._id,
        appointmentDate: selectedSlot.availableDate,
        appointmentTime: selectedSlot.startTime,
        sessionType,
        availabilityId: selectedSlot._id,
      });
      addToast('success', 'Appointment booked successfully!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; requiresPlan?: boolean; requiresUpgrade?: boolean } } })?.response?.data;
      if (errData?.requiresPlan) {
        addToast('info', 'You need a plan to book. Redirecting to pricing...');
        setTimeout(() => navigate('/pricing'), 1000);
        return;
      }
      if (errData?.requiresUpgrade) {
        addToast('error', errData.message || 'Please upgrade your plan.');
        return;
      }
      addToast('error', errData?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!consultant) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500">Consultant not found.</p>
      </div>
    );
  }

  // Show subscription required banner
  if (hasSubscription === false) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-3">Subscription Required</h2>
          <p className="text-gray-600 mb-2 max-w-md mx-auto">
            You need to subscribe to a plan before booking your first session. Choose a plan to get started — we have a free option too!
          </p>
          {consultant && (
            <p className="text-sm text-gray-500 mb-6">
              You're booking with <span className="font-semibold">{consultant.user?.fullName}</span>. After choosing a plan, come back to complete your booking.
            </p>
          )}
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-8 py-3 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors"
          >
            <CreditCard size={18} />
            Choose a Plan
          </Link>
        </div>
      </div>
    );
  }

  // Show session limit reached
  if (subscription?.isAtLimit) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-3">Session Limit Reached</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You've used all {subscription.monthlyLimit} sessions included in your {subscription.plan?.planName} plan this month. Upgrade to get more sessions.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-8 py-3 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  const profilePhotoUrl = consultant.profilePhoto
    ? getUploadUrl(consultant.profilePhoto)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy mb-8">Book Appointment</h1>

      {/* Subscription Info Bar */}
      {subscription && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 flex items-center gap-3 text-sm">
          <CreditCard size={16} className="text-blue-500 flex-shrink-0" />
          <span className="text-blue-700">
            <span className="font-medium">{subscription.plan?.planName} Plan</span>
            {' — '}
            {typeof subscription.remaining === 'string'
              ? `${subscription.remaining} sessions`
              : `${subscription.remaining} sessions remaining this month`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Date Selection */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Select Date
            </h3>
            {uniqueDates.length === 0 ? (
              <p className="text-gray-500">No available dates. Check back later.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {uniqueDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDate === date
                        ? 'bg-royal text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                <Clock size={20} />
                Select Time
              </h3>
              {filteredSlots.length === 0 ? (
                <p className="text-gray-500">No available slots for this date.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {filteredSlots.map((slot) => (
                    <button
                      key={slot._id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSlot?._id === slot._id
                          ? 'bg-royal text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Session Type */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-navy mb-4">Session Type</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setSessionType('video_call')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  sessionType === 'video_call'
                    ? 'border-royal bg-royal/5 text-royal'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Video size={20} />
                Video Call
              </button>
              <button
                onClick={() => setSessionType('chat')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  sessionType === 'chat'
                    ? 'border-royal bg-royal/5 text-royal'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <MessageSquare size={20} />
                Chat
              </button>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-2xl shadow-md p-6 h-fit sticky top-24">
          <h3 className="font-semibold text-navy mb-4">Booking Summary</h3>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-bold">
                {getInitials(consultant.user?.fullName || '')}
              </div>
            )}
            <div>
              <p className="font-medium">{consultant.user?.fullName}</p>
              <p className="text-sm text-gray-500">{consultant.specialization}</p>
            </div>
          </div>
          {selectedSlot && (
            <div className="space-y-2 mb-4 pb-4 border-b border-gray-100 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{selectedSlot.availableDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium">{sessionType === 'video_call' ? 'Video Call' : 'Chat'}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-600">Total</span>
            <span className="text-xl font-bold text-navy">{formatCurrency(consultant.hourlyRate)}</span>
          </div>
          <button
            onClick={handleBook}
            disabled={!selectedSlot || booking}
            className="w-full py-3 bg-gold text-navy font-semibold rounded-xl hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {booking ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
