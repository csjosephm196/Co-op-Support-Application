import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { GraduationCap, FileText, ClipboardCheck, Users, BarChart3, MapPin, Send, ArrowRight, Zap } from 'lucide-react';

function LandingPage() {
  return (
    <div className="fade-in">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center py-20 px-4 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium mb-6">
            <Zap className="w-4 h-4" /> Co-op Management Made Simple
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">Co-op Support</span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Application</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            A complete platform for managing co-op student applications, work term reports,
            employer evaluations, and program compliance — all in one place.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="btn-primary text-base px-8 py-3 flex items-center gap-2 shadow-lg shadow-blue-500/25">
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <LandingPage />;

  const quickLinks = () => {
    switch (user.role) {
      case 'student':
        return [
          { to: '/student/application', label: 'My Application', desc: 'Submit or view your co-op application', icon: <FileText className="w-6 h-6" />, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 group-hover:bg-blue-100' },
          { to: '/student/documents', label: 'Documents', desc: 'Upload work term reports', icon: <ClipboardCheck className="w-6 h-6" />, gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50 group-hover:bg-emerald-100' },
        ];
      case 'coordinator':
      case 'admin':
        return [
          { to: '/coordinator/review', label: 'Review Applications', desc: 'Provisional and final review queue', icon: <ClipboardCheck className="w-6 h-6" />, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 group-hover:bg-blue-100' },
          { to: '/coordinator/compliance', label: 'Compliance Report', desc: 'Statistics and missing submissions', icon: <BarChart3 className="w-6 h-6" />, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 group-hover:bg-purple-100' },
          { to: '/coordinator/tracker', label: 'Placement Tracker', desc: 'Track students seeking placement', icon: <MapPin className="w-6 h-6" />, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 group-hover:bg-amber-100' },
          { to: '/coordinator/invitations', label: 'Send Invitations', desc: 'Onboard coordinators & employers', icon: <Send className="w-6 h-6" />, gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50 group-hover:bg-emerald-100' },
        ];
      case 'employer':
        return [
          { to: '/employer/students', label: 'My Students', desc: 'View students assigned to you', icon: <Users className="w-6 h-6" />, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 group-hover:bg-blue-100' },
          { to: '/employer/upload', label: 'Submit Evaluation', desc: 'Upload PDF or fill online form', icon: <FileText className="w-6 h-6" />, gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50 group-hover:bg-emerald-100' },
          { to: '/employer/evaluations', label: 'Past Evaluations', desc: 'View submitted evaluations', icon: <ClipboardCheck className="w-6 h-6" />, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 group-hover:bg-purple-100' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Welcome back, {user.fullName.split(' ')[0]}
            </h1>
            <p className="text-gray-500 mt-0.5">
              {user.role === 'student' && 'Manage your co-op application and work term documents.'}
              {user.role === 'coordinator' && 'Review applications, track compliance, and manage the co-op program.'}
              {user.role === 'admin' && 'Full administrative access to the co-op portal.'}
              {user.role === 'employer' && 'Submit evaluations for your assigned co-op students.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {quickLinks().map((link, i) => (
          <Link
            key={link.to}
            to={link.to}
            className={`card p-6 group hover:border-blue-200 transition-all duration-300 ${i === 0 ? 'fade-in' : i === 1 ? 'fade-in-delay' : 'fade-in-delay-2'}`}
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              {link.icon}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{link.label}</h3>
                <p className="text-sm text-gray-500">{link.desc}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
