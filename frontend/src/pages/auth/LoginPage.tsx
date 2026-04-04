import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [pending2FA, setPending2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.requires2FA) {
        setPending2FA(true);
        setTempToken(result.tempToken!);
        toast('Please enter your 2FA code');
      } else {
        toast.success('Logged in successfully');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verify2FA(tempToken, totpCode);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid 2FA code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-5 shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to the Co-op Support Portal</p>
        </div>

        <div className="card p-8">
          {!pending2FA ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="Enter your password"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FA} className="space-y-5">
              <p className="text-sm text-gray-600 text-center">Enter the 6-digit code from your authenticator app.</p>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="input text-center text-2xl tracking-[0.3em] font-mono"
                placeholder="000000"
              />
              <button type="submit" disabled={submitting || totpCode.length !== 6} className="btn-primary w-full">
                {submitting ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
