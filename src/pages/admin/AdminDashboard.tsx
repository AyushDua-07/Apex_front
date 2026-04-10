import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { getAdminStats, getAdminSessions } from '../../services/api';
import type { AdminStats, Appointment } from '../../types';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalConsultants: 0, totalBookings: 0, revenue: 0, pendingConsultants: 0 });
  const [recentSessions, setRecentSessions] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, aRes] = await Promise.all([getAdminStats(), getAdminSessions()]);
        setStats(sRes.data);
        setRecentSessions(aRes.data.slice(0, 5));
      } catch {
        // Stats will show 0
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={24} />, color: 'bg-blue-500', link: '/admin/users' },
    { label: 'Approved Consultants', value: stats.totalConsultants, icon: <UserCheck size={24} />, color: 'bg-green-500', link: '/admin/consultants' },
    { label: 'Pending Review', value: stats.pendingConsultants || 0, icon: <AlertCircle size={24} />, color: 'bg-yellow-500', link: '/admin/consultants' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: <Calendar size={24} />, color: 'bg-purple-500', link: '/admin/sessions' },
    { label: 'Revenue', value: formatCurrency(stats.revenue), icon: <DollarSign size={24} />, color: 'bg-gold', link: '#' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white`}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-navy">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Pending Consultants Alert */}
      {(stats.pendingConsultants || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-600" />
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">{stats.pendingConsultants}</span> consultant{(stats.pendingConsultants || 0) > 1 ? 's' : ''} awaiting review with uploaded documents.
            </p>
          </div>
          <Link to="/admin/consultants" className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700">
            Review Now
          </Link>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy">Recent Activity</h2>
          <Link to="/admin/sessions" className="text-royal text-sm font-medium hover:underline">View All</Link>
        </div>
        {recentSessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSessions.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 py-3 text-sm">{s.client?.fullName || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{s.consultant?.user?.fullName || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(s.appointmentDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(s.status)}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
