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
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">My Assigned Students</h1>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No students assigned to you yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Student ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Work Term</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr key={s.assignment_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.full_name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.student_number}</td>
                  <td className="px-4 py-3 text-gray-600">{s.work_term || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
