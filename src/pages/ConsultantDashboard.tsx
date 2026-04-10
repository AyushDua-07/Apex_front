import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Edit3, Save, Plus, Trash2, Shield, AlertCircle, CheckCircle, XCircle, Video, Star, Camera, Upload, FileText, X } from 'lucide-react';
import { getMyConsultantProfile, updateMyConsultantProfile, getMyAvailability, addMyAvailability, deleteMyAvailability, getMyAppointments, getMyPlanUsage, uploadConsultantProfilePhoto, uploadConsultantDocuments, deleteConsultantDocument } from '../services/api';
import type { Consultant, Availability, Appointment } from '../types';
import { formatCurrency, formatDate, formatTime, getStatusColor, getInitials, getUploadUrl } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StarRating from '../components/StarRating';
import { Link } from 'react-router-dom';

const ConsultantDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<Consultant | null>(null);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [planUsage, setPlanUsage] = useState<{
    planName: string;
    monthlyTransactionLimit: number;
    usedThisMonth: number;
    remaining: number | string;
    isAtLimit: boolean;
  } | null>(null);

  const [editForm, setEditForm] = useState({
    specialization: '',
    bio: '',
    yearsExperience: 0,
    hourlyRate: 0,
  });

  const [showAddSlots, setShowAddSlots] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [pRes, sRes, aRes] = await Promise.all([
        getMyConsultantProfile(),
        getMyAvailability(),
        getMyAppointments(),
      ]);
      setProfile(pRes.data);
      setSlots(sRes.data);
      setAppointments(aRes.data);
      setEditForm({
        specialization: pRes.data.specialization || '',
        bio: pRes.data.bio || '',
        yearsExperience: pRes.data.yearsExperience || 0,
        hourlyRate: pRes.data.hourlyRate || 0,
      });

      try {
        const uRes = await getMyPlanUsage();
        setPlanUsage(uRes.data);
      } catch { /* optional */ }
    } catch {
      addToast('error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await updateMyConsultantProfile(editForm);
      setProfile(res.data);
      setEditing(false);
      addToast('success', 'Profile updated!');
    } catch {
      addToast('error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'Photo must be under 5MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      const res = await uploadConsultantProfilePhoto(formData);
      setProfile(res.data);
      addToast('success', 'Profile photo updated!');
    } catch {
      addToast('error', 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingDocs(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('documents', f));
      const res = await uploadConsultantDocuments(formData);
      setProfile(res.data);
      addToast('success', 'Documents uploaded!');
    } catch {
      addToast('error', 'Failed to upload documents.');
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      await deleteConsultantDocument(docId);
      setProfile((prev) => prev ? { ...prev, documents: prev.documents?.filter((d) => d._id !== docId) } : prev);
      addToast('success', 'Document removed.');
    } catch {
      addToast('error', 'Failed to remove document.');
    }
  };

  const handleAddSlot = async () => {
    if (!newSlotDate || !newSlotStart || !newSlotEnd) {
      addToast('error', 'Please fill in all slot fields.');
      return;
    }
    try {
      await addMyAvailability([{ availableDate: newSlotDate, startTime: newSlotStart, endTime: newSlotEnd }]);
      addToast('success', 'Availability slot added!');
      setNewSlotDate('');
      setNewSlotStart('09:00');
      setNewSlotEnd('10:00');
      const sRes = await getMyAvailability();
      setSlots(sRes.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add slot.';
      addToast('error', msg);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteMyAvailability(slotId);
      setSlots((prev) => prev.filter((s) => s._id !== slotId));
      addToast('success', 'Slot removed.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete slot.';
      addToast('error', msg);
    }
  };

  if (loading) return <LoadingSpinner />;

  const statusIcon = profile?.verificationStatus === 'approved'
    ? <CheckCircle size={20} className="text-green-500" />
    : profile?.verificationStatus === 'rejected'
    ? <XCircle size={20} className="text-red-500" />
    : <AlertCircle size={20} className="text-yellow-500" />;

  const statusMessage = profile?.verificationStatus === 'approved'
    ? 'Your profile is approved and visible to clients.'
    : profile?.verificationStatus === 'rejected'
    ? 'Your profile has been rejected. Please update your details and documents, then contact support.'
    : 'Your profile is pending admin review. Upload your photo and documents to speed up approval.';

  const upcoming = appointments.filter((a) => ['pending', 'confirmed'].includes(a.status));
  const past = appointments.filter((a) => ['completed', 'cancelled'].includes(a.status));

  const today = new Date().toISOString().split('T')[0];
  const futureSlots = slots.filter((s) => s.availableDate >= today);
  const groupedSlots: Record<string, Availability[]> = {};
  futureSlots.forEach((s) => {
    if (!groupedSlots[s.availableDate]) groupedSlots[s.availableDate] = [];
    groupedSlots[s.availableDate].push(s);
  });

  const photoUrl = profile?.profilePhoto ? getUploadUrl(profile.profilePhoto) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Consultant Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.fullName}</p>
      </div>

      {/* Verification Status Banner */}
      <div className={`rounded-2xl p-4 mb-8 flex items-center gap-3 ${
        profile?.verificationStatus === 'approved' ? 'bg-green-50 border border-green-200'
        : profile?.verificationStatus === 'rejected' ? 'bg-red-50 border border-red-200'
        : 'bg-yellow-50 border border-yellow-200'
      }`}>
        {statusIcon}
        <div className="flex-1">
          <p className="font-medium text-gray-900 flex items-center gap-2">
            <Shield size={16} />
            Verification Status:
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(profile?.verificationStatus || 'pending')}`}>
              {profile?.verificationStatus || 'pending'}
            </span>
          </p>
          <p className="text-sm text-gray-600 mt-1">{statusMessage}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-navy">My Profile</h2>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-royal text-sm font-medium hover:underline">
                  <Edit3 size={14} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-1 px-3 py-1 text-sm bg-royal text-white rounded-lg hover:bg-royal-dark disabled:opacity-50">
                    <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input type="text" value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input type="number" min="0" value={editForm.yearsExperience} onChange={(e) => setEditForm({ ...editForm, yearsExperience: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                    <input type="number" min="0" value={editForm.hourlyRate} onChange={(e) => setEditForm({ ...editForm, hourlyRate: Number(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={4} maxLength={2000} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none resize-none" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {/* Profile Photo with upload */}
                  <div className="relative">
                    {photoUrl ? (
                      <img src={photoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-navy text-white flex items-center justify-center text-xl font-bold">
                        {getInitials(user?.fullName || '')}
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-royal rounded-full flex items-center justify-center cursor-pointer hover:bg-royal-dark transition-colors">
                      {uploadingPhoto ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={14} className="text-white" />
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user?.fullName}</h3>
                    <span className="inline-block px-2 py-0.5 bg-royal/10 text-royal text-xs rounded-full font-medium">
                      {profile?.specialization}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-navy">{formatCurrency(profile?.hourlyRate || 0)}</p>
                    <p className="text-xs text-gray-500">per hour</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-navy">{profile?.yearsExperience || 0}</p>
                    <p className="text-xs text-gray-500">years exp.</p>
                  </div>
                  <div className="text-center">
                    <StarRating rating={profile?.averageRating || 0} showNumber />
                  </div>
                </div>
                {profile?.bio && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-navy flex items-center gap-2">
                <FileText size={20} /> Verification Documents
              </h2>
              <label className="flex items-center gap-1 text-royal text-sm font-medium hover:underline cursor-pointer">
                {uploadingDocs ? (
                  <div className="w-3 h-3 border-2 border-royal border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                Upload
                <input type="file" accept="image/*,.pdf" multiple onChange={handleDocUpload} className="hidden" disabled={uploadingDocs} />
              </label>
            </div>

            {(!profile?.documents || profile.documents.length === 0) ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                <p className="text-xs text-gray-400 mt-1">Upload ID, certifications, or credentials for admin review.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {profile.documents.map((doc) => (
                  <div key={doc._id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <FileText size={16} className={doc.fileType?.includes('pdf') ? 'text-red-500' : 'text-blue-500'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{doc.fileName}</p>
                      <p className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</p>
                    </div>
                    <a
                      href={getUploadUrl(doc.filePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-royal hover:underline"
                    >
                      View
                    </a>
                    <button onClick={() => handleDeleteDoc(doc._id)} className="text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
              <Calendar size={20} /> Upcoming Sessions ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock size={40} className="mx-auto text-gray-300 mb-3" />
                <p>No upcoming sessions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                        {getInitials(apt.client?.fullName || '')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{apt.client?.fullName}</p>
                        <p className="text-xs text-gray-500">{formatDate(apt.appointmentDate)} at {formatTime(apt.appointmentTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(apt.status)}`}>{apt.status}</span>
                      <Link to={`/session/${apt._id}`} className="px-3 py-1 bg-royal text-white text-xs rounded-lg hover:bg-royal-dark flex items-center gap-1">
                        <Video size={12} /> Join
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Sessions */}
          {past.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                <Clock size={20} /> Past Sessions ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((apt) => (
                  <div key={apt._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
                        {getInitials(apt.client?.fullName || '')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{apt.client?.fullName}</p>
                        <p className="text-xs text-gray-500">{formatDate(apt.appointmentDate)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(apt.status)}`}>{apt.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-navy flex items-center gap-2">
                <Calendar size={20} /> Availability
              </h2>
              {profile?.verificationStatus === 'approved' && (
                <button onClick={() => setShowAddSlots(!showAddSlots)} className="flex items-center gap-1 text-royal text-sm font-medium hover:underline">
                  <Plus size={14} /> Add
                </button>
              )}
            </div>

            {profile?.verificationStatus !== 'approved' && (
              <p className="text-sm text-gray-500 mb-4">You can manage availability once your profile is approved.</p>
            )}

            {showAddSlots && profile?.verificationStatus === 'approved' && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" value={newSlotDate} onChange={(e) => setNewSlotDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-royal focus:border-transparent outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
                    <input type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-royal focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
                    <input type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-royal focus:border-transparent outline-none" />
                  </div>
                </div>
                <button onClick={handleAddSlot} className="w-full py-2 bg-royal text-white text-sm font-medium rounded-lg hover:bg-royal-dark">Add Slot</button>
              </div>
            )}

            {Object.keys(groupedSlots).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming availability slots.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                  <div key={date}>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="space-y-1">
                      {dateSlots.map((slot) => (
                        <div key={slot._id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${slot.isBooked ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                          <span>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span>
                          {slot.isBooked ? (
                            <span className="text-xs font-medium text-red-500">Booked</span>
                          ) : (
                            <button onClick={() => handleDeleteSlot(slot._id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-semibold text-navy mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Sessions</span>
                <span className="font-medium">{appointments.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completed</span>
                <span className="font-medium text-green-600">{appointments.filter((a) => a.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Upcoming</span>
                <span className="font-medium text-blue-600">{upcoming.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Available Slots</span>
                <span className="font-medium">{futureSlots.filter((s) => !s.isBooked).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rating</span>
                <span className="font-medium flex items-center gap-1">
                  <Star size={14} className="text-gold fill-gold" /> {profile?.averageRating?.toFixed(1) || '0.0'}
                </span>
              </div>
            </div>
          </div>

          {/* My Plan */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy">My Plan</h3>
              <Link to="/pricing" className="text-royal text-xs font-medium hover:underline">Change Plan</Link>
            </div>
            {planUsage ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current Plan</span>
                  <span className="font-semibold text-navy">{planUsage.planName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sessions This Month</span>
                  <span className="font-medium">{planUsage.usedThisMonth}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly Limit</span>
                  <span className="font-medium">
                    {planUsage.monthlyTransactionLimit === -1 ? 'Unlimited' : planUsage.monthlyTransactionLimit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Remaining</span>
                  <span className={`font-medium ${planUsage.isAtLimit ? 'text-red-600' : 'text-green-600'}`}>
                    {planUsage.remaining}
                  </span>
                </div>
                {planUsage.monthlyTransactionLimit !== -1 && (
                  <div className="pt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${planUsage.isAtLimit ? 'bg-red-500' : 'bg-royal'}`}
                        style={{ width: `${Math.min(100, (planUsage.usedThisMonth / planUsage.monthlyTransactionLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">No plan selected.</p>
                <Link to="/pricing" className="block text-center py-2 bg-royal text-white text-sm font-medium rounded-lg hover:bg-royal-dark">Choose a Plan</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultantDashboard;
