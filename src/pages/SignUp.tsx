import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, FileText, X, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { uploadConsultantProfilePhoto, uploadConsultantDocuments } from '../services/api';
import PenguinMascot from '../components/PenguinMascot';

const SignUp: React.FC = () => {
  const [role, setRole] = useState<'client' | 'consultant'>('client');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [penguinState, setPenguinState] = useState<'idle' | 'watching' | 'covering' | 'shaking' | 'happy'>('idle');
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // File upload states
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [uploadStep, setUploadStep] = useState<'form' | 'uploading' | 'done'>('form');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('error', 'Photo must be under 5MB.');
        return;
      }
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setProfilePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        addToast('error', `${f.name} is too large (max 10MB).`);
        return false;
      }
      return true;
    });
    if (documentFiles.length + valid.length > 5) {
      addToast('error', 'Maximum 5 documents allowed.');
      return;
    }
    setDocumentFiles((prev) => [...prev, ...valid]);
  };

  const removeDoc = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate consultant uploads
    if (role === 'consultant') {
      if (!profilePhotoFile) {
        addToast('error', 'Please upload a profile photo.');
        return;
      }
      if (documentFiles.length === 0) {
        addToast('error', 'Please upload at least one verification document (ID, certification, etc.).');
        return;
      }
    }

    setLoading(true);
    try {
      const data: Record<string, unknown> = { fullName, email, password, phone, role };
      if (role === 'consultant') {
        data.specialization = specialization;
        data.yearsExperience = Number(yearsExperience) || 0;
        data.hourlyRate = Number(hourlyRate) || 0;
        data.bio = bio;
      }

      // Step 1: Register the account
      await register(data);

      // Step 2: If consultant, upload files
      if (role === 'consultant') {
        setUploadStep('uploading');

        // Upload profile photo
        if (profilePhotoFile) {
          const photoFormData = new FormData();
          photoFormData.append('profilePhoto', profilePhotoFile);
          try {
            await uploadConsultantProfilePhoto(photoFormData);
          } catch {
            addToast('error', 'Account created but photo upload failed. You can upload it from your dashboard.');
          }
        }

        // Upload documents
        if (documentFiles.length > 0) {
          const docFormData = new FormData();
          documentFiles.forEach((f) => docFormData.append('documents', f));
          try {
            await uploadConsultantDocuments(docFormData);
          } catch {
            addToast('error', 'Account created but document upload failed. You can upload from your dashboard.');
          }
        }

        setUploadStep('done');
      }

      setPenguinState('happy');
      addToast('success', role === 'consultant'
        ? 'Account created! Your profile and documents are pending admin review.'
        : 'Account created successfully!'
      );
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err: unknown) {
      setPenguinState('shaking');
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      addToast('error', msg);
      setTimeout(() => setPenguinState('idle'), 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-lg">
        <PenguinMascot state={penguinState} />
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-navy text-center mb-6">Create Account</h2>

          {/* Role Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                role === 'client' ? 'bg-white text-navy shadow' : 'text-gray-500'
              }`}
            >
              I'm a Client
            </button>
            <button
              type="button"
              onClick={() => setRole('consultant')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                role === 'consultant' ? 'bg-white text-navy shadow' : 'text-gray-500'
              }`}
            >
              I'm a Consultant
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setPenguinState('watching')}
                onBlur={() => setPenguinState('idle')}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setPenguinState('watching')}
                onBlur={() => setPenguinState('idle')}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPenguinState('covering')}
                onBlur={() => setPenguinState('idle')}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
              />
            </div>

            {role === 'consultant' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    required
                    placeholder="e.g. Finance, Marketing, Technology"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      min="0"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Tell clients about your expertise..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none resize-none"
                  />
                </div>

                {/* Profile Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Photo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {profilePhotoPreview ? (
                        <img
                          src={profilePhotoPreview}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-royal"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Camera size={24} className="text-gray-400" />
                        </div>
                      )}
                      <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-royal rounded-full flex items-center justify-center cursor-pointer hover:bg-royal-dark transition-colors">
                        <Camera size={14} className="text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Upload a professional photo.</p>
                      <p>JPEG, PNG or WebP, max 5MB.</p>
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Documents <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Upload ID, certifications, or credentials for admin verification. PDF or image, max 10MB each, up to 5 files.
                  </p>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-royal hover:bg-royal/5 transition-colors">
                    <Upload size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload documents</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleDocSelect}
                      className="hidden"
                    />
                  </label>
                  {documentFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {documentFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                          <FileText size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="truncate flex-1 text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                          <button type="button" onClick={() => removeDoc(i)} className="text-gray-400 hover:text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-50"
            >
              {loading
                ? uploadStep === 'uploading'
                  ? 'Uploading files...'
                  : 'Creating Account...'
                : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-royal font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
