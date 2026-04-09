import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, MessageSquare } from 'lucide-react';
import { getAdvisorById, getAdvisorAvailability, createAppointment } from '../services/api';
import type { Consultant, Availability } from '../types';
import { formatCurrency, formatTime, getInitials } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const BookAppointment: React.FC = () => {
  const { consultantId } = useParams<{ consultantId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [sessionType, setSessionType] = useState<'video_call' | 'chat'>('video_call');

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
      } catch {
        addToast('error', 'Failed to load booking information.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [consultantId, addToast]);

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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Booking failed';
      addToast('error', msg);
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy mb-8">Book Appointment</h1>

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
            <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-bold">
              {getInitials(consultant.user?.fullName || '')}
            </div>
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
