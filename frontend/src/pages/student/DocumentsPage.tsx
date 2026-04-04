import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, FileCheck, AlertTriangle, Clock, FileText, Copy, X } from 'lucide-react';

interface Doc {
  id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  confirmation_number: string;
  uploaded_at: string;
}

interface Deadline {
  id: string;
  document_type: string;
  work_term: string;
  due_date: string;
}

interface TemplateSection { heading: string; placeholder: string; }
interface Template {
  title: string;
  student: { name: string; studentId: string; email: string; program: string; yearOfStudy: string };
  sections: TemplateSection[];
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('work_term_report');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastConfirmation, setLastConfirmation] = useState('');
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = () => {
    api.get('/documents/mine')
      .then(({ data }) => setDocs(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDocs();
    api.get('/documents/deadlines').then(({ data }) => setDeadlines(data)).catch(() => {});
  }, []);

  const handleGenerateTemplate = async () => {
    try {
      const { data } = await api.get('/documents/template');
      setTemplate(data);
      setShowTemplate(true);
    } catch {
      toast.error('Failed to generate template');
    }
  };

  const activeDeadline = deadlines.find((d) => d.document_type === 'work_term_report');
  const isOverdue = activeDeadline ? new Date(activeDeadline.due_date) < new Date() : false;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) { setSelectedFile(null); return; }
    if (file.type !== 'application/pdf') { setFileError('Only PDF files are allowed'); setSelectedFile(null); return; }
    if (file.size > 10 * 1024 * 1024) { setFileError('File exceeds 10MB limit'); setSelectedFile(null); return; }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    setShowConfirm(false);
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', docType);
      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.pastDeadline) {
        toast('Document uploaded, but it was submitted after the deadline.', { icon: '⚠️' });
      } else {
        toast.success('Document uploaded!');
      }
      setLastConfirmation(data.confirmationNumber);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchDocs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      {activeDeadline && (
        <div className={`card p-4 flex items-center gap-3 border-l-4 ${isOverdue ? 'border-l-red-500 !bg-red-50' : 'border-l-blue-500 !bg-blue-50'}`}>
          <Clock className={`w-5 h-5 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-blue-500'}`} />
          <div>
            <p className={`text-sm font-semibold ${isOverdue ? 'text-red-800' : 'text-blue-800'}`}>
              {isOverdue ? 'Deadline Passed' : 'Upcoming Deadline'}
            </p>
            <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
              Work Term Report ({activeDeadline.work_term}): {new Date(activeDeadline.due_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {isOverdue && ' — Please submit as soon as possible.'}
            </p>
          </div>
        </div>
      )}

      <div className="card p-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h1 className="section-title text-xl">Upload Document</h1>
          </div>
          <button onClick={handleGenerateTemplate}
            className="btn-secondary text-sm flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Generate Template
          </button>
        </div>
        <p className="text-gray-500 text-sm mb-6 ml-[52px]">Submit your work term reports in PDF format.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Document Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="input">
              <option value="work_term_report">Work Term Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">File (PDF only, max 10MB)</label>
            <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelect}
              className="input file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold file:text-sm file:cursor-pointer hover:file:bg-blue-100" />
            {fileError && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3 h-3" /> {fileError}
              </p>
            )}
          </div>

          <button onClick={() => setShowConfirm(true)} disabled={!selectedFile || uploading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Submit Document'}
          </button>
        </div>

        {lastConfirmation && (
          <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-emerald-800 font-semibold text-sm">Document uploaded successfully</p>
              <p className="text-emerald-600 text-xs mt-1 font-mono">Confirmation #: {lastConfirmation}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">My Documents</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : docs.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {docs.map((doc) => (
              <div key={doc.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{doc.file_name || 'Online Form'}</p>
                    <p className="text-xs text-gray-400">
                      {doc.document_type.replace(/_/g, ' ')} &middot; {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">{doc.confirmation_number}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirm Upload</h2>
            <p className="text-gray-500 text-sm mb-1">File: <span className="font-medium text-gray-700">{selectedFile?.name}</span></p>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to upload this document?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleUpload} className="btn-primary flex-1">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showTemplate && template && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl w-full max-h-[85vh] overflow-y-auto p-8 relative">
            <button onClick={() => setShowTemplate(false)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{template.title}</h2>
            <p className="text-sm text-gray-500 mb-6">Copy this structure into your document editor.</p>

            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-400">Student</span><span className="font-semibold">{template.student.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">ID</span><span className="font-semibold">{template.student.studentId}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Program</span><span className="font-semibold">{template.student.program || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Year</span><span className="font-semibold">{template.student.yearOfStudy || 'N/A'}</span></div>
            </div>

            <div className="space-y-3">
              {template.sections.map((section, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-1">{section.heading}</h3>
                  <p className="text-sm text-gray-400 italic">{section.placeholder}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => {
                const text = `${template.title}\n\nStudent: ${template.student.name}\nID: ${template.student.studentId}\nProgram: ${template.student.program}\nYear: ${template.student.yearOfStudy}\n\n` +
                  template.sections.map(s => `${s.heading}\n${s.placeholder}\n`).join('\n');
                navigator.clipboard.writeText(text);
                toast.success('Template copied!');
              }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" /> Copy to Clipboard
              </button>
              <button onClick={() => setShowTemplate(false)} className="btn-secondary flex-1">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
