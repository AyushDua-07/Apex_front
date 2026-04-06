import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PenguinMascot from '../components/PenguinMascot';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [penguinState, setPenguinState] = useState<'idle' | 'watching' | 'covering' | 'shaking' | 'happy'>('idle');
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      setPenguinState('happy');
      addToast('success', 'Welcome back!');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err: unknown) {
      setPenguinState('shaking');
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      addToast('error', msg);
      setTimeout(() => setPenguinState('idle'), 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <PenguinMascot state={penguinState} />
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-navy text-center mb-6">Welcome Back</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="you@example.com"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-royal text-white font-semibold rounded-lg hover:bg-royal-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-royal font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
