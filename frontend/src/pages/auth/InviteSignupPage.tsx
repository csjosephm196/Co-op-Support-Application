import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { UserCheck, AlertCircle } from 'lucide-react';

interface InviteData {
  email: string;
  full_name: string;
  role: string;
}

export default function InviteSignupPage() {
  const { token } = useParams<{ token: string }>();
  const { inviteSignup } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get(`/auth/invite/${token}`)
      .then(({ data }) => { setInvite(data); setLoading(false); })
      .catch(() => { setError('This invitation link is invalid or has expired.'); setLoading(false); });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
      toast.error('Password must be 8+ chars with uppercase, number, and symbol');
      return;
    }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setSubmitting(true);
    try {
      await inviteSignup(token!, password);
      toast.success('Account created!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 fade-in">
        <div className="card p-10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-600 mb-2">Invalid Invitation</h1>
          <p className="text-gray-500">{error || 'This invitation is no longer valid.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mb-5 shadow-lg shadow-emerald-500/25">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Complete Your Sign Up</h1>
          <p className="text-gray-500 mt-2">
            You&apos;re being onboarded as a <span className="badge badge-info capitalize">{invite.role}</span>
          </p>
        </div>

        <div className="card p-8">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 mb-6 space-y-2 border border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Name</span>
              <span className="font-semibold">{invite.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Email</span>
              <span className="font-semibold">{invite.email}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required className="input"
                placeholder="Min 8 chars, uppercase, number, symbol" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                required className="input" placeholder="Re-enter password" />
            </div>
            <button type="submit" disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 !mt-6">
              <UserCheck className="w-4 h-4" />
              {submitting ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
