import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (user?.isVerified) navigate('/');
    const timer = setTimeout(() => setCanResend(true), 30000);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verifyEmail(code);
      toast.success('Email verified!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendVerification();
      toast.success('Verification code resent');
      setCanResend(false);
      setTimeout(() => setCanResend(true), 30000);
    } catch {
      toast.error('Failed to resend code');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
            <MailCheck className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-500 mb-6">
            We sent a 6-digit code to <strong>{user?.email}</strong>
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="000000"
            />
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <button
            onClick={handleResend}
            disabled={!canResend}
            className="mt-4 text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition"
          >
            {canResend ? 'Resend Email' : 'Resend available in 30s...'}
          </button>

          <p className="mt-4 text-xs text-gray-400">
            Having trouble? Contact Support at support@csa-portal.com
          </p>
        </div>
      </div>
    </div>
  );
}
