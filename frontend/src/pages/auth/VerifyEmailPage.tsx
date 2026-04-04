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
    <div className="min-h-[80vh] flex items-center justify-center px-4 fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-5 shadow-lg shadow-blue-500/25">
            <MailCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Verify Your Email</h1>
          <p className="text-gray-500 mt-2">
            We sent a 6-digit code to <strong className="text-gray-700">{user?.email}</strong>
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleVerify} className="space-y-5">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="input text-center text-2xl tracking-[0.3em] font-mono"
              placeholder="000000"
            />
            <button type="submit" disabled={submitting || code.length !== 6}
              className="btn-primary w-full">
              {submitting ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="text-center mt-5">
            <button onClick={handleResend} disabled={!canResend}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-colors">
              {canResend ? 'Resend Email' : 'Resend available in 30s...'}
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Having trouble? Contact Support at support@csa-portal.com
          </p>
        </div>
      </div>
    </div>
  );
}
