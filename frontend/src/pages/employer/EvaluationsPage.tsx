import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText } from 'lucide-react';

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
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Submitted Evaluations</h1>
      </div>

      {evals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No evaluations submitted yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Confirmation #</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {evals.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{ev.student_name}</td>
                  <td className="px-4 py-3">
                    {ev.is_online_form ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Online Form</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">PDF Upload</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{ev.confirmation_number}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(ev.uploaded_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
