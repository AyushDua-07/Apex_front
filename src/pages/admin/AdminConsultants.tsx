import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, CheckCircle, XCircle, Eye, FileText, Image, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminConsultants, getAdminConsultantById, updateConsultantStatus } from '../../services/api';
import type { Consultant, ConsultantDocument } from '../../types';
import { formatCurrency, getStatusColor, getUploadUrl, formatDate } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminConsultants: React.FC = () => {
  const { addToast } = useToast();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reviewConsultant, setReviewConsultant] = useState<Consultant | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

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
      setReviewConsultant(null);
      loadConsultants();
    } catch {
      addToast('error', 'Failed to update consultant status.');
    }
  };

  const openReview = async (consultant: Consultant) => {
    setReviewLoading(true);
    try {
      const res = await getAdminConsultantById(consultant._id);
      setReviewConsultant(res.data);
    } catch {
      addToast('error', 'Failed to load consultant details.');
    } finally {
      setReviewLoading(false);
    }
  };

  const filtered = consultants.filter(
    (c) =>
      c.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      c.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: pending first
  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
    return (order[a.verificationStatus] || 3) - (order[b.verificationStatus] || 3);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="text-gray-400 hover:text-navy">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-navy">Consultant Management</h1>
        {consultants.filter((c) => c.verificationStatus === 'pending').length > 0 && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            {consultants.filter((c) => c.verificationStatus === 'pending').length} pending review
          </span>
        )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Docs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((c) => {
                const photoUrl = c.profilePhoto ? getUploadUrl(c.profilePhoto) : null;
                return (
                  <tr key={c._id} className={c.verificationStatus === 'pending' ? 'bg-yellow-50/50' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {photoUrl ? (
                          <img src={photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                            {c.user?.fullName?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{c.user?.fullName}</p>
                          <p className="text-xs text-gray-500">{c.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-royal/10 text-royal">
                        {c.specialization}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(c.hourlyRate)}/hr</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {c.documents?.length || 0} file{(c.documents?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(c.verificationStatus)}`}>
                        {c.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openReview(c)}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <Eye size={14} />
                          Review
                        </button>
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
                );
              })}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <p className="text-center text-gray-500 py-8">No consultants found.</p>
        )}
      </div>

      {/* Review Modal */}
      {(reviewConsultant || reviewLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {reviewLoading ? (
              <div className="p-12 text-center">
                <LoadingSpinner />
              </div>
            ) : reviewConsultant ? (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-navy">Review Consultant Application</h3>
                  <button onClick={() => setReviewConsultant(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>

                {/* Consultant Info */}
                <div className="p-6 space-y-6">
                  {/* Profile Section */}
                  <div className="flex items-start gap-4">
                    {reviewConsultant.profilePhoto ? (
                      <img
                        src={getUploadUrl(reviewConsultant.profilePhoto)}
                        alt=""
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                        ?
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{reviewConsultant.user?.fullName}</h4>
                      <p className="text-sm text-gray-500">{reviewConsultant.user?.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-royal/10 text-royal">
                          {reviewConsultant.specialization}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reviewConsultant.verificationStatus)}`}>
                          {reviewConsultant.verificationStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Hourly Rate</p>
                      <p className="font-semibold text-navy">{formatCurrency(reviewConsultant.hourlyRate)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Experience</p>
                      <p className="font-semibold text-navy">{reviewConsultant.yearsExperience || 0} years</p>
                    </div>
                  </div>

                  {reviewConsultant.bio && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Bio</p>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">{reviewConsultant.bio}</p>
                    </div>
                  )}

                  {/* Documents Section */}
                  <div>
                    <p className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                      <FileText size={16} />
                      Verification Documents ({reviewConsultant.documents?.length || 0})
                    </p>
                    {(!reviewConsultant.documents || reviewConsultant.documents.length === 0) ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-yellow-700">No documents uploaded by this consultant.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {reviewConsultant.documents.map((doc: ConsultantDocument) => {
                          const isImage = doc.fileType?.startsWith('image/');
                          const docUrl = getUploadUrl(doc.filePath);
                          return (
                            <div key={doc._id} className="border border-gray-200 rounded-lg overflow-hidden">
                              <div className="flex items-center gap-3 px-4 py-3">
                                {isImage ? (
                                  <Image size={16} className="text-blue-500 flex-shrink-0" />
                                ) : (
                                  <FileText size={16} className="text-red-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded {formatDate(doc.uploadedAt)}
                                  </p>
                                </div>
                                <a
                                  href={docUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                  <ExternalLink size={12} />
                                  View
                                </a>
                              </div>
                              {/* Inline preview for images */}
                              {isImage && (
                                <div className="px-4 pb-3">
                                  <img
                                    src={docUrl}
                                    alt={doc.fileName}
                                    className="max-h-48 rounded-lg border border-gray-200 object-contain"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    {reviewConsultant.verificationStatus !== 'approved' && (
                      <button
                        onClick={() => handleStatus(reviewConsultant._id, 'approved')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={18} />
                        Approve Consultant
                      </button>
                    )}
                    {reviewConsultant.verificationStatus !== 'rejected' && (
                      <button
                        onClick={() => handleStatus(reviewConsultant._id, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                      >
                        <XCircle size={18} />
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => setReviewConsultant(null)}
                      className="px-6 py-3 border border-gray-300 text-gray-600 font-semibold rounded-xl hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsultants;
