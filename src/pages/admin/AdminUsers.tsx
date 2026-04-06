import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminUsers, updateUserStatus } from '../../services/api';
import type { User } from '../../types';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminUsers: React.FC = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    try {
      const res = await getAdminUsers();
      setUsers(res.data);
    } catch {
      addToast('error', 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatus(user._id, newStatus);
      addToast('success', `User ${newStatus}.`);
      loadUsers();
    } catch {
      addToast('error', 'Failed to update user status.');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="text-gray-400 hover:text-navy">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-navy">User Management</h1>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search users..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{u.fullName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(u.accountStatus)}`}>
                      {u.accountStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg ${
                          u.accountStatus === 'active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {u.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">No users found.</p>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
