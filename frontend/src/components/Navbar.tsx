import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, GraduationCap, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-lg">
            <GraduationCap className="w-6 h-6" />
            <span className="hidden sm:inline">CSA Portal</span>
          </Link>

          {user && (
            <>
              <div className="hidden md:flex items-center gap-1">
                {navLinks().map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {user.fullName} <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full ml-1">{user.role}</span>
                </span>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Log out">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          )}

          {!user && (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-700">Sign In</Link>
              <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700">Sign Up</Link>
            </div>
          )}
        </div>
      </div>

      {menuOpen && user && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pb-4">
          {navLinks().map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-primary-700 hover:bg-primary-50"
            >
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="block w-full text-left px-3 py-2 mt-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50">
            Log Out
          </button>
        </div>
      )}
    </nav>
  );
}
