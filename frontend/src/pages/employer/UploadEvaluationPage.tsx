import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, FileCheck, AlertTriangle, ClipboardList } from 'lucide-react';

interface Student {
  student_id: string;
  full_name: string;
}

type SubmitMethod = 'pdf' | 'form';

export default function UploadEvaluationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<SubmitMethod>('pdf');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastConfirmation, setLastConfirmation] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    performanceRating: '',
    technicalSkills: '',
    communication: '',
    teamwork: '',
    initiative: '',
    overallComments: '',
    recommendForFuture: '',
  });

  useEffect(() => {
    api.get('/employer/students')
      .then(({ data }) => setStudents(data.map((s: any) => ({ student_id: s.student_id, full_name: s.full_name }))))
      .finally(() => setLoading(false));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) { setSelectedFile(null); return; }
    if (file.type !== 'application/pdf') { setFileError('Only PDF files are allowed'); setSelectedFile(null); return; }
    if (file.size > 10 * 1024 * 1024) { setFileError('File exceeds 10MB limit'); setSelectedFile(null); return; }
    setSelectedFile(file);
  };

  const handleSubmitPdf = async () => {
    setShowConfirm(false);
    if (!selectedFile || !selectedStudent) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('studentId', selectedStudent);
      const { data } = await api.post('/documents/employer-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Evaluation uploaded!');
      setLastConfirmation(data.confirmationNumber);
      setSelectedFile(null);
      setSelectedStudent('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForm = async () => {
    setShowConfirm(false);
    if (!selectedStudent) return;
    const required = ['performanceRating', 'technicalSkills', 'communication', 'overallComments'] as const;
    for (const f of required) {
      if (!formData[f]) { toast.error(`Missing required field: ${f.replace(/([A-Z])/g, ' $1').trim()}`); return; }
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/documents/employer-form', { studentId: selectedStudent, formData });
      toast.success('Evaluation form submitted!');
      setLastConfirmation(data.confirmationNumber);
      setFormData({ performanceRating: '', technicalSkills: '', communication: '', teamwork: '', initiative: '', overallComments: '', recommendForFuture: '' });
      setSelectedStudent('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = selectedStudent && (method === 'pdf' ? selectedFile : formData.performanceRating && formData.technicalSkills && formData.communication && formData.overallComments);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="section-title text-xl">Submit Evaluation</h1>
            <p className="text-gray-500 text-sm mt-0.5">Upload a scanned PDF or fill out the online form.</p>
          </div>
        </div>

        <div className="space-y-5 mt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Student *</label>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="input">
              <option value="">Choose a student...</option>
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Submission Method</label>
            <div className="flex gap-3">
              <button onClick={() => setMethod('pdf')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all
                  ${method === 'pdf' ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <Upload className="w-4 h-4" /> Upload PDF
              </button>
              <button onClick={() => setMethod('form')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all
                  ${method === 'form' ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <ClipboardList className="w-4 h-4" /> Online Form
              </button>
            </div>
          </div>

          {method === 'pdf' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Evaluation PDF</label>
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelect}
                className="input file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold file:text-sm file:cursor-pointer hover:file:bg-blue-100" />
              {fileError && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium"><AlertTriangle className="w-3 h-3" /> {fileError}</p>}
            </div>
          ) : (
            <div className="space-y-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-100">
              {([
                { key: 'performanceRating', label: 'Performance Rating *', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
                { key: 'technicalSkills', label: 'Technical Skills *', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
                { key: 'communication', label: 'Communication *', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
                { key: 'teamwork', label: 'Teamwork', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
                { key: 'initiative', label: 'Initiative', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
                { key: 'recommendForFuture', label: 'Recommend for Future?', options: ['Yes', 'No', 'Maybe'] },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                  <select value={formData[f.key as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="input bg-white">
                    <option value="">Select...</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Overall Comments *</label>
                <textarea value={formData.overallComments} onChange={(e) => setFormData({ ...formData, overallComments: e.target.value })}
                  rows={4} className="input bg-white resize-y"
                  placeholder="Provide your overall assessment of the student's co-op performance..." />
              </div>
            </div>
          )}

          <button onClick={() => setShowConfirm(true)} disabled={!canSubmit || submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </div>

        {lastConfirmation && (
          <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-emerald-800 font-semibold text-sm">Evaluation submitted successfully</p>
              <p className="text-emerald-600 text-xs mt-1 font-mono">Confirmation #: {lastConfirmation}</p>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirm Submission</h2>
            <p className="text-gray-500 text-sm mb-6">
              Submit this evaluation {method === 'pdf' ? 'PDF' : 'form'} for the selected student?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={method === 'pdf' ? handleSubmitPdf : handleSubmitForm} className="btn-primary flex-1">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
