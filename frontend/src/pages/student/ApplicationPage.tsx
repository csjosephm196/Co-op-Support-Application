import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, Clock, XCircle, Send, Save } from 'lucide-react';

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

const statusDisplay: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', badge: 'badge badge-gray', icon: <FileText className="w-4 h-4" /> },
  pending: { label: 'Pending Review', badge: 'badge badge-pending', icon: <Clock className="w-4 h-4" /> },
  provisionally_accepted: { label: 'Under Review', badge: 'badge badge-pending', icon: <Clock className="w-4 h-4" /> },
  provisionally_rejected: { label: 'Under Review', badge: 'badge badge-pending', icon: <Clock className="w-4 h-4" /> },
  finally_accepted: { label: 'Accepted', badge: 'badge badge-success', icon: <CheckCircle className="w-4 h-4" /> },
  finally_rejected: { label: 'Rejected', badge: 'badge badge-danger', icon: <XCircle className="w-4 h-4" /> },
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
    } catch { /* silent */ }
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
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const s = statusDisplay[app.status] || statusDisplay.draft;

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto fade-in">
        <div className="card p-10 text-center">
          <div className={`inline-flex items-center gap-2 ${s.badge} mb-5 text-sm`}>
            {s.icon} {s.label}
          </div>
          <h1 className="section-title text-2xl mb-3">Application Submitted</h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Your co-op application has been submitted and is under review. You will receive an email once a decision has been made.
          </p>
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-5 text-left space-y-3 text-sm border border-gray-100">
            <div className="flex justify-between"><span className="text-gray-400">Program</span><span className="font-semibold text-gray-900">{app.program}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">GPA</span><span className="font-semibold text-gray-900">{app.gpa}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Year</span><span className="font-semibold text-gray-900">{app.yearOfStudy}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto fade-in">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="section-title text-xl">Co-op Application</h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
              <Save className="w-3 h-3" /> Auto-saving enabled
            </div>
          </div>
        </div>

        <div className="space-y-5 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">GPA *</label>
              <input type="number" step="0.01" min="0" max="4.0" value={app.gpa}
                onChange={(e) => handleChange('gpa', e.target.value)}
                className={`input ${app.gpa && parseFloat(app.gpa) < 3.0 ? 'input-error' : ''}`}
                placeholder="3.50" />
              {app.gpa && parseFloat(app.gpa) < 3.0 && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">Minimum 3.0 GPA required</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year of Study *</label>
              <select value={app.yearOfStudy} onChange={(e) => handleChange('yearOfStudy', e.target.value)}
                className="input">
                <option value="">Select</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Program *</label>
            <input type="text" value={app.program} onChange={(e) => handleChange('program', e.target.value)}
              className="input" placeholder="Computer Science" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={app.phone} onChange={(e) => handleChange('phone', e.target.value)}
                className="input" placeholder="(416) 555-0123" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
              <input type="text" value={app.address} onChange={(e) => handleChange('address', e.target.value)}
                className="input" placeholder="123 Main St, Toronto" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Letter</label>
            <textarea value={app.coverLetter} onChange={(e) => handleChange('coverLetter', e.target.value)}
              rows={5} className="input resize-y"
              placeholder="Why you want to participate in the co-op program..." />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Additional Information</label>
            <textarea value={app.additionalInfo} onChange={(e) => handleChange('additionalInfo', e.target.value)}
              rows={3} className="input resize-y"
              placeholder="Any other details..." />
          </div>

          <button onClick={() => setShowConfirm(true)} disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 !mt-7">
            <Send className="w-4 h-4" />
            Submit Application
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirm Submission</h2>
            <p className="text-gray-500 text-sm mb-6">
              Once submitted, you cannot modify your application. Are you sure?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmit} className="btn-primary flex-1">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
