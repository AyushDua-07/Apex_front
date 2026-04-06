import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminConsultants, updateConsultantStatus } from '../../services/api';
import type { Consultant } from '../../types';
import { formatCurrency, getStatusColor } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminConsultants: React.FC = () => {
  const { addToast } = useToast();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadConsultants = async () => {
    try {
      const res = await getAdminConsultants();
      setConsultants(res.data);
    } catch {
      addToast('error', 'Failed to load consultants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConsultants(); }, []);

  const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateConsultantStatus(id, status);
      addToast('success', `Consultant ${status}.`);
      loadConsultants();
    } catch {
      addToast('error', 'Failed to update consultant status.');
    }
  };

  const filtered = consultants.filter(
    (c) =>
      c.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="text-gray-400 hover:text-navy">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-navy">Consultant Management</h1>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search consultants..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{c.user?.fullName}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-royal/10 text-royal">
                      {c.specialization}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(c.hourlyRate)}/hr</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.yearsExperience || 0} yrs</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(c.verificationStatus)}`}>
                      {c.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {c.verificationStatus !== 'approved' && (
                        <button
                          onClick={() => handleStatus(c._id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                      )}
                      {c.verificationStatus !== 'rejected' && (
                        <button
                          onClick={() => handleStatus(c._id, 'rejected')}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">No consultants found.</p>
        )}
      </div>
    </div>
  );
};

export default AdminConsultants;
