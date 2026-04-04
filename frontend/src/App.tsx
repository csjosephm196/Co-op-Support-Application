import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import InviteSignupPage from './pages/auth/InviteSignupPage';
import HomePage from './pages/HomePage';

import ApplicationPage from './pages/student/ApplicationPage';
import DocumentsPage from './pages/student/DocumentsPage';

import ReviewPage from './pages/coordinator/ReviewPage';
import CompliancePage from './pages/coordinator/CompliancePage';
import TrackerPage from './pages/coordinator/TrackerPage';
import InvitationsPage from './pages/coordinator/InvitationsPage';

import StudentsPage from './pages/employer/StudentsPage';
import EvaluationsPage from './pages/employer/EvaluationsPage';
import UploadEvaluationPage from './pages/employer/UploadEvaluationPage';

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: { borderRadius: '12px', background: '#1e293b', color: '#f8fafc', fontSize: '14px', fontWeight: 500 },
        success: { style: { background: '#059669' } },
        error: { style: { background: '#dc2626' } },
      }} />
      <Navbar />
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <Routes>
          {/* Public / Auth Routes */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/invite/:token" element={<InviteSignupPage />} />

          {/* Home */}
          <Route path="/" element={<HomePage />} />

          {/* Student Routes */}
          <Route path="/student/application" element={
            <ProtectedRoute roles={['student']}>
              <ApplicationPage />
            </ProtectedRoute>
          } />
          <Route path="/student/documents" element={
            <ProtectedRoute roles={['student']}>
              <DocumentsPage />
            </ProtectedRoute>
          } />

          {/* Coordinator / Admin Routes */}
          <Route path="/coordinator/review" element={
            <ProtectedRoute roles={['coordinator', 'admin']}>
              <ReviewPage />
            </ProtectedRoute>
          } />
          <Route path="/coordinator/compliance" element={
            <ProtectedRoute roles={['coordinator', 'admin']}>
              <CompliancePage />
            </ProtectedRoute>
          } />
          <Route path="/coordinator/tracker" element={
            <ProtectedRoute roles={['coordinator', 'admin']}>
              <TrackerPage />
            </ProtectedRoute>
          } />
          <Route path="/coordinator/invitations" element={
            <ProtectedRoute roles={['coordinator', 'admin']}>
              <InvitationsPage />
            </ProtectedRoute>
          } />

          {/* Employer Routes */}
          <Route path="/employer/students" element={
            <ProtectedRoute roles={['employer']}>
              <StudentsPage />
            </ProtectedRoute>
          } />
          <Route path="/employer/evaluations" element={
            <ProtectedRoute roles={['employer']}>
              <EvaluationsPage />
            </ProtectedRoute>
          } />
          <Route path="/employer/upload" element={
            <ProtectedRoute roles={['employer']}>
              <UploadEvaluationPage />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
