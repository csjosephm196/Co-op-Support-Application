import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { GraduationCap, FileText, ClipboardCheck, Users, BarChart3, MapPin, Send } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  const quickLinks = () => {
    switch (user.role) {
      case 'student':
        return [
          { to: '/student/application', label: 'My Application', desc: 'Submit or view your co-op application', icon: <FileText className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
          { to: '/student/documents', label: 'Documents', desc: 'Upload work term reports', icon: <ClipboardCheck className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
        ];
      case 'coordinator':
      case 'admin':
        return [
          { to: '/coordinator/review', label: 'Review Applications', desc: 'Provisional and final review queue', icon: <ClipboardCheck className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
          { to: '/coordinator/compliance', label: 'Compliance Report', desc: 'Statistics and missing submissions', icon: <BarChart3 className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
          { to: '/coordinator/tracker', label: 'Placement Tracker', desc: 'Track students seeking placement', icon: <MapPin className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600' },
          { to: '/coordinator/invitations', label: 'Send Invitations', desc: 'Onboard coordinators & employers', icon: <Send className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
        ];
      case 'employer':
        return [
          { to: '/employer/students', label: 'My Students', desc: 'View students assigned to you', icon: <Users className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
          { to: '/employer/upload', label: 'Submit Evaluation', desc: 'Upload PDF or fill online form', icon: <FileText className="w-6 h-6" />, color: 'bg-green-50 text-green-600' },
          { to: '/employer/evaluations', label: 'Past Evaluations', desc: 'View submitted evaluations', icon: <ClipboardCheck className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.fullName.split(' ')[0]}</h1>
        </div>
        <p className="text-gray-500">
          {user.role === 'student' && 'Manage your co-op application and work term documents.'}
          {user.role === 'coordinator' && 'Review applications, track compliance, and manage the co-op program.'}
          {user.role === 'admin' && 'Full administrative access to the co-op portal.'}
          {user.role === 'employer' && 'Submit evaluations for your assigned co-op students.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks().map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-primary-200 transition group"
          >
            <div className={`inline-flex p-3 rounded-xl mb-3 ${link.color} group-hover:scale-105 transition`}>
              {link.icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{link.label}</h3>
            <p className="text-sm text-gray-500">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
