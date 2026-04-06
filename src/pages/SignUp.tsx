import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: Record<string, unknown> = { fullName, email, password, phone, role };
      if (role === 'consultant') {
        data.specialization = specialization;
        data.yearsExperience = Number(yearsExperience) || 0;
        data.hourlyRate = Number(hourlyRate) || 0;
        data.bio = bio;
      }
      await register(data);
      setPenguinState('happy');
      addToast('success', role === 'consultant' ? 'Account created! Awaiting admin approval.' : 'Account created successfully!');
      setTimeout(() => navigate('/dashboard'), 500);
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
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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
