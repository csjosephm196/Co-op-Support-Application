import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users } from 'lucide-react';

interface AssignedStudent {
  assignment_id: string;
  student_id: string;
  full_name: string;
  email: string;
  student_number: string;
  work_term: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employer/students')
      .then(({ data }) => setStudents(data))
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h1 className="section-title text-2xl">My Assigned Students</h1>
      </div>

      {students.length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No students assigned to you yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Student ID</th>
                <th className="table-header-cell">Work Term</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr key={s.assignment_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="table-cell">
                    <p className="font-semibold text-gray-900">{s.full_name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </td>
                  <td className="table-cell text-gray-600 font-mono text-xs">{s.student_number}</td>
                  <td className="table-cell">
                    <span className="badge badge-info">{s.work_term || 'N/A'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
