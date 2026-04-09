import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminSessions } from '../../services/api';
import type { Appointment } from '../../types';
import { formatDate, formatTime, getStatusColor } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminSessions: React.FC = () => {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAdminSessions();
        setSessions(res.data);
      } catch {
        addToast('error', 'Failed to load sessions.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = sessions.filter(
    (s) =>
      s.client?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.consultant?.user?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="text-gray-400 hover:text-navy">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-navy">Session Management</h1>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.client?.fullName || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.consultant?.user?.fullName || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(s.appointmentDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatTime(s.appointmentTime)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {s.sessionType === 'video_call' ? 'Video' : s.sessionType === 'chat' ? 'Chat' : 'Other'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">No sessions found.</p>
        )}
      </div>
    </div>
  );
};

export default AdminSessions;
