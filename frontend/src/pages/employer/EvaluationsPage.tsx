import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, ClipboardList, Upload } from 'lucide-react';

interface Evaluation {
  id: string;
  student_id: string;
  student_name: string;
  file_name: string | null;
  is_online_form: boolean;
  confirmation_number: string;
  uploaded_at: string;
}

export default function EvaluationsPage() {
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employer/evaluations')
      .then(({ data }) => setEvals(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h1 className="section-title text-2xl">Submitted Evaluations</h1>
      </div>

      {evals.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No evaluations submitted yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Confirmation #</th>
                <th className="table-header-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {evals.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="table-cell font-semibold text-gray-900">{ev.student_name}</td>
                  <td className="table-cell">
                    {ev.is_online_form ? (
                      <span className="badge badge-info"><ClipboardList className="w-3 h-3" /> Online Form</span>
                    ) : (
                      <span className="badge badge-gray"><Upload className="w-3 h-3" /> PDF Upload</span>
                    )}
                  </td>
                  <td className="table-cell text-gray-500 font-mono text-xs">{ev.confirmation_number}</td>
                  <td className="table-cell text-gray-500">{new Date(ev.uploaded_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
