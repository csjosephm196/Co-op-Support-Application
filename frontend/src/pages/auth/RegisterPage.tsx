import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', studentId: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().split(/\s+/).length < 2) e.fullName = 'Enter your full name (first and last)';
    if (!form.studentId.trim()) e.studentId = 'Student ID is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'At least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Needs an uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Needs a number';
    else if (!/[!@#$%^&*]/.test(form.password)) e.password = 'Needs a special character';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({ email: form.email, password: form.password, fullName: form.fullName, studentId: form.studentId });
      toast.success('Account created! Please verify your email.');
      navigate('/verify-email');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition ${errors[key] ? 'border-red-400' : 'border-gray-300'}`}
        placeholder={placeholder}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
              <UserPlus className="w-6 h-6 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Student Sign Up</h1>
            <p className="text-gray-500 mt-1">Create your Co-op portal account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('fullName', 'Full Name', 'text', 'John Doe')}
            {field('studentId', 'Student ID', 'text', '501 234 567')}
            {field('email', 'Email', 'email', 'you@university.edu')}
            {field('password', 'Password', 'password', 'Min 8 chars, uppercase, number, symbol')}
            {field('confirmPassword', 'Confirm Password', 'password', 'Re-enter password')}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign In</Link>
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            Coordinators &amp; Employers: You must be invited. Contact the co-op management team.
          </p>
        </div>
      </div>
    </div>
  );
}
