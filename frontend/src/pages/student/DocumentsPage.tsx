import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, FileCheck, AlertTriangle, Clock, FileText } from 'lucide-react';

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

interface TemplateSection {
  heading: string;
  placeholder: string;
}

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
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are allowed');
      setSelectedFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File exceeds 10MB limit');
      setSelectedFile(null);
      return;
    }
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
    <div className="max-w-3xl mx-auto space-y-6">
      {activeDeadline && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <Clock className={`w-5 h-5 ${isOverdue ? 'text-red-500' : 'text-blue-500'}`} />
          <div>
            <p className={`text-sm font-medium ${isOverdue ? 'text-red-800' : 'text-blue-800'}`}>
              {isOverdue ? 'Deadline Passed' : 'Upcoming Deadline'}
            </p>
            <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
              Work Term Report ({activeDeadline.work_term}): {new Date(activeDeadline.due_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {isOverdue && ' — Please submit as soon as possible.'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
          <button onClick={handleGenerateTemplate}
            className="px-3 py-1.5 text-sm border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Generate Template
          </button>
        </div>
        <p className="text-gray-500 text-sm mb-6">Submit your work term reports in PDF format.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
              <option value="work_term_report">Work Term Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF only)</label>
            <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelect}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium file:cursor-pointer" />
            {fileError && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {fileError}
              </p>
            )}
          </div>

          <button onClick={() => setShowConfirm(true)} disabled={!selectedFile || uploading}
            className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Submit / Upload'}
          </button>
        </div>

        {lastConfirmation && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium text-sm">Document uploaded successfully</p>
              <p className="text-green-600 text-xs mt-1">Confirmation #: {lastConfirmation}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">My Documents</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : docs.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No documents uploaded yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {docs.map((doc) => (
              <div key={doc.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{doc.file_name || 'Online Form'}</p>
                  <p className="text-xs text-gray-500">
                    {doc.document_type.replace(/_/g, ' ')} &middot; {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs text-gray-400 font-mono">{doc.confirmation_number}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold mb-2">Confirm Upload</h2>
            <p className="text-gray-500 text-sm mb-1">File: {selectedFile?.name}</p>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to upload this document?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleUpload} className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showTemplate && template && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl p-8 relative">
            <button onClick={() => setShowTemplate(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{template.title}</h2>
            <p className="text-sm text-gray-500 mb-6">Use this template as a guide for writing your work term report. Copy the structure below into a document editor.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Student:</span><span className="font-medium">{template.student.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">ID:</span><span className="font-medium">{template.student.studentId}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Program:</span><span className="font-medium">{template.student.program || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Year:</span><span className="font-medium">{template.student.yearOfStudy || 'N/A'}</span></div>
            </div>

            <div className="space-y-4">
              {template.sections.map((section, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
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
                toast.success('Template copied to clipboard');
              }} className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition">
                Copy to Clipboard
              </button>
              <button onClick={() => setShowTemplate(false)} className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
