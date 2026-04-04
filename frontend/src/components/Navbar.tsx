import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, GraduationCap, Menu, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'student':
        return [
          { to: '/student/application', label: 'Application' },
          { to: '/student/documents', label: 'Documents' },
        ];
      case 'coordinator':
      case 'admin':
        return [
          { to: '/coordinator/review', label: 'Review' },
          { to: '/coordinator/compliance', label: 'Compliance' },
          { to: '/coordinator/tracker', label: 'Tracker' },
          { to: '/coordinator/invitations', label: 'Invitations' },
        ];
      case 'employer':
        return [
          { to: '/employer/students', label: 'My Students' },
          { to: '/employer/evaluations', label: 'Evaluations' },
          { to: '/employer/upload', label: 'Submit Evaluation' },
        ];
      default:
        return [];
    }
  };

  const roleColor = () => {
    switch (user?.role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'coordinator': return 'bg-blue-100 text-blue-700';
      case 'employer': return 'bg-emerald-100 text-emerald-700';
      case 'student': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:inline font-bold text-gray-900 text-lg tracking-tight">CSA Portal</span>
          </Link>

          {user && (
            <>
              <div className="hidden md:flex items-center gap-0.5 bg-gray-100/80 rounded-xl p-1">
                {navLinks().map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive(link.to)
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{user.fullName}</p>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${roleColor()} px-1.5 py-0.5 rounded`}>{user.role}</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Log out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}

          {!user && (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
              <Link to="/register" className="btn-primary text-sm flex items-center gap-1">
                Get Started <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {menuOpen && user && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl px-4 pb-4 pt-2 animate-in">
          {navLinks().map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive(link.to) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 mt-1 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50">
            Log Out
          </button>
        </div>
      )}
    </nav>
  );
}
