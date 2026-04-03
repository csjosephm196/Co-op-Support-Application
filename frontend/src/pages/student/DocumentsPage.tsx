import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, FileCheck, AlertTriangle } from 'lucide-react';

interface Doc {
  id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  confirmation_number: string;
  uploaded_at: string;
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
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = () => {
    api.get('/documents/mine')
      .then(({ data }) => setDocs(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, []);

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
      toast.success('Document uploaded!');
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload Document</h1>
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
    </div>
  );
}
