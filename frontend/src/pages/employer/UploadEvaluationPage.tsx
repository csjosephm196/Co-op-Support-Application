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
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Submit Evaluation</h1>
        <p className="text-gray-500 text-sm mb-6">Upload a scanned PDF or fill out the online evaluation form.</p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student *</label>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
              <option value="">Choose a student...</option>
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Submission Method</label>
            <div className="flex gap-3">
              <button onClick={() => setMethod('pdf')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition
                  ${method === 'pdf' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <Upload className="w-4 h-4" /> Upload PDF
              </button>
              <button onClick={() => setMethod('form')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition
                  ${method === 'form' ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                <ClipboardList className="w-4 h-4" /> Online Form
              </button>
            </div>
          </div>

          {method === 'pdf' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation PDF</label>
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelect}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium file:cursor-pointer" />
              {fileError && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {fileError}</p>}
            </div>
          ) : (
            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              {([
                { key: 'performanceRating', label: 'Performance Rating *', type: 'select', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
                { key: 'technicalSkills', label: 'Technical Skills *', type: 'select', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
                { key: 'communication', label: 'Communication *', type: 'select', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
                { key: 'teamwork', label: 'Teamwork', type: 'select', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
                { key: 'initiative', label: 'Initiative', type: 'select', options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
                { key: 'recommendForFuture', label: 'Recommend for Future?', type: 'select', options: ['Yes', 'No', 'Maybe'] },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <select value={formData[f.key as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                    <option value="">Select...</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overall Comments *</label>
                <textarea value={formData.overallComments} onChange={(e) => setFormData({ ...formData, overallComments: e.target.value })}
                  rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y bg-white"
                  placeholder="Provide your overall assessment of the student's co-op performance..." />
              </div>
            </div>
          )}

          <button onClick={() => setShowConfirm(true)} disabled={!canSubmit || submitting}
            className="w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition">
            {submitting ? 'Submitting...' : 'Submit / Upload'}
          </button>
        </div>

        {lastConfirmation && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium text-sm">Evaluation submitted successfully</p>
              <p className="text-green-600 text-xs mt-1">Confirmation #: {lastConfirmation}</p>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold mb-2">Confirm Submission</h2>
            <p className="text-gray-500 text-sm mb-6">
              Submit this evaluation {method === 'pdf' ? 'PDF' : 'form'} for the selected student?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Cancel</button>
              <button onClick={method === 'pdf' ? handleSubmitPdf : handleSubmitForm}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
