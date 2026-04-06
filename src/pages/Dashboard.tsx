import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, Star, Search } from 'lucide-react';
import { getMyAppointments, updateAppointmentStatus } from '../services/api';
import type { Appointment } from '../types';
import { formatDate, formatTime, formatCurrency, getInitials, getStatusColor } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await getMyAppointments();
      setAppointments(res.data);
    } catch {
      addToast('error', 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateAppointmentStatus(id, status);
      addToast('success', `Appointment ${status}.`);
      loadAppointments();
    } catch {
      addToast('error', 'Failed to update appointment.');
    }
  };

  const upcoming = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status));
  const past = appointments.filter((a) => ['completed', 'cancelled'].includes(a.status));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.fullName}</p>
        </div>
        {user?.role === 'client' && (
          <Link
            to="/consultants"
            className="px-4 py-2 bg-royal text-white text-sm font-medium rounded-lg hover:bg-royal-dark transition-colors flex items-center gap-2"
          >
            <Search size={16} />
            Find Consultants
          </Link>
        )}
      </div>

      {/* Upcoming Sessions */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Upcoming Sessions ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <Clock size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No upcoming sessions.</p>
            {user?.role === 'client' && (
              <Link to="/consultants" className="text-royal font-medium text-sm hover:underline mt-2 inline-block">
                Browse consultants to book your first session
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((apt) => (
              <div key={apt._id} className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm">
                      {getInitials(
                        user?.role === 'client'
                          ? apt.consultant?.user?.fullName || ''
                          : apt.client?.fullName || ''
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {user?.role === 'client'
                          ? apt.consultant?.user?.fullName
                          : apt.client?.fullName}
                      </p>
                      {apt.consultant?.specialization && (
                        <p className="text-sm text-gray-500">{apt.consultant.specialization}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(apt.appointmentDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {formatTime(apt.appointmentTime)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/session/${apt._id}`}
                    className="flex-1 py-2 bg-royal text-white text-sm font-medium rounded-lg text-center hover:bg-royal-dark transition-colors flex items-center justify-center gap-1"
                  >
                    <Video size={14} />
                    Join Session
                  </Link>
                  <button
                    onClick={() => handleStatusUpdate(apt._id, 'cancelled')}
                    className="px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Sessions */}
      <section>
        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <Clock size={20} />
          Past Sessions ({past.length})
        </h2>
        {past.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <p className="text-gray-500">No past sessions.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {user?.role === 'client' ? 'Consultant' : 'Client'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {past.map((apt) => (
                  <tr key={apt._id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {user?.role === 'client'
                          ? apt.consultant?.user?.fullName
                          : apt.client?.fullName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(apt.appointmentDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {apt.status === 'completed' && user?.role === 'client' && (
                        <Link
                          to={`/consultants/${apt.consultant?._id}`}
                          className="text-royal text-sm font-medium hover:underline flex items-center gap-1"
                        >
                          <Star size={14} />
                          Leave Review
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
