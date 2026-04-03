import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, Clock, XCircle } from 'lucide-react';

interface ApplicationData {
  id?: string;
  status: string;
  gpa: string;
  program: string;
  yearOfStudy: string;
  coverLetter: string;
  additionalInfo: string;
  phone: string;
  address: string;
}

const emptyApp: ApplicationData = {
  status: 'draft',
  gpa: '',
  program: '',
  yearOfStudy: '',
  coverLetter: '',
  additionalInfo: '',
  phone: '',
  address: '',
};

const statusDisplay: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'text-gray-500 bg-gray-100', icon: <FileText className="w-5 h-5" /> },
  pending: { label: 'Pending Review', color: 'text-yellow-700 bg-yellow-100', icon: <Clock className="w-5 h-5" /> },
  provisionally_accepted: { label: 'Pending Review', color: 'text-yellow-700 bg-yellow-100', icon: <Clock className="w-5 h-5" /> },
  provisionally_rejected: { label: 'Pending Review', color: 'text-yellow-700 bg-yellow-100', icon: <Clock className="w-5 h-5" /> },
  finally_accepted: { label: 'Accepted', color: 'text-green-700 bg-green-100', icon: <CheckCircle className="w-5 h-5" /> },
  finally_rejected: { label: 'Rejected', color: 'text-red-700 bg-red-100', icon: <XCircle className="w-5 h-5" /> },
};

export default function ApplicationPage() {
  const [app, setApp] = useState<ApplicationData>(emptyApp);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    api.get('/applications/mine')
      .then(({ data }) => {
        if (data) {
          const saved = data.autosave_data || {};
          setApp({
            id: data.id,
            status: data.status,
            gpa: data.gpa?.toString() || saved.gpa || '',
            program: data.program || saved.program || '',
            yearOfStudy: data.year_of_study?.toString() || saved.yearOfStudy || '',
            coverLetter: data.cover_letter || saved.coverLetter || '',
            additionalInfo: data.additional_info || saved.additionalInfo || '',
            phone: data.phone || saved.phone || '',
            address: data.address || saved.address || '',
          });
          if (data.status !== 'draft') setSubmitted(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const autosave = useCallback(async (data: ApplicationData) => {
    if (submitted) return;
    try {
      await api.post('/applications/autosave', {
        gpa: data.gpa, program: data.program, yearOfStudy: data.yearOfStudy,
        coverLetter: data.coverLetter, additionalInfo: data.additionalInfo,
        phone: data.phone, address: data.address,
      });
    } catch { /* silent autosave failure */ }
  }, [submitted]);

  useEffect(() => {
    if (loading || submitted) return;
    const timer = setTimeout(() => autosave(app), 2000);
    return () => clearTimeout(timer);
  }, [app, loading, submitted, autosave]);

  const handleChange = (key: keyof ApplicationData, value: string) => {
    setApp((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      await api.post('/applications/submit', {
        gpa: app.gpa, program: app.program, yearOfStudy: app.yearOfStudy,
        coverLetter: app.coverLetter, additionalInfo: app.additionalInfo,
        phone: app.phone, address: app.address,
      });
      toast.success('Application submitted!');
      setSubmitted(true);
      setApp((prev) => ({ ...prev, status: 'pending' }));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const s = statusDisplay[app.status] || statusDisplay.draft;

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${s.color} mb-4`}>
            {s.icon} {s.label}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h1>
          <p className="text-gray-500 mb-6">
            Your co-op application has been submitted and is under review. You will receive an email once a decision has been made.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Program</span><span className="font-medium">{app.program}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">GPA</span><span className="font-medium">{app.gpa}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Year</span><span className="font-medium">{app.yearOfStudy}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Co-op Application</h1>
        <p className="text-gray-500 text-sm mb-6">Your progress is automatically saved.</p>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GPA *</label>
              <input type="number" step="0.01" min="0" max="4.0" value={app.gpa}
                onChange={(e) => handleChange('gpa', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="3.50" />
              {app.gpa && parseFloat(app.gpa) < 3.0 && (
                <p className="text-red-500 text-xs mt-1">Minimum 3.0 GPA required</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study *</label>
              <select value={app.yearOfStudy} onChange={(e) => handleChange('yearOfStudy', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
                <option value="">Select</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
            <input type="text" value={app.program} onChange={(e) => handleChange('program', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Computer Science" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={app.phone} onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="(416) 555-0123" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" value={app.address} onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="123 Main St, Toronto, ON" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
            <textarea value={app.coverLetter} onChange={(e) => handleChange('coverLetter', e.target.value)}
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
              placeholder="Why you want to participate in the co-op program..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
            <textarea value={app.additionalInfo} onChange={(e) => handleChange('additionalInfo', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
              placeholder="Any other details..." />
          </div>

          <div className="pt-2">
            <button onClick={() => setShowConfirm(true)} disabled={submitting}
              className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
              Submit Application
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold mb-2">Confirm Submission</h2>
            <p className="text-gray-500 text-sm mb-6">
              Once submitted, you cannot modify your application. Are you sure?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleSubmit} className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
