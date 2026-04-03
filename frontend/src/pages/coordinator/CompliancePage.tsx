import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BarChart3, AlertTriangle, Send, Users, FileText, Briefcase } from 'lucide-react';

interface Stats {
  totalStudents: number;
  applications: Record<string, number>;
  reports: { with_report: number; without_report: number };
  evaluations: { with_evaluation: number; without_evaluation: number };
  placements: Record<string, number>;
}

interface MissingSubmission {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  has_work_report: boolean;
  has_evaluation: boolean;
}

export default function CompliancePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [missing, setMissing] = useState<MissingSubmission[]>([]);
  const [tab, setTab] = useState<'stats' | 'missing'>('stats');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/coordinator/compliance'),
      api.get('/coordinator/missing-submissions'),
    ]).then(([statsRes, missingRes]) => {
      setStats(statsRes.data);
      setMissing(missingRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSendReminders = async () => {
    setSending(true);
    try {
      const { data } = await api.post('/coordinator/send-reminders');
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  const statCards = stats ? [
    { label: 'Total Students', value: stats.totalStudents, icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Applications', value: stats.applications.pending || 0, icon: <FileText className="w-5 h-5" />, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Accepted', value: stats.applications.finally_accepted || 0, icon: <Briefcase className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
    { label: 'Missing Reports', value: stats.reports.without_report || 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-50 text-red-600' },
    { label: 'Missing Evaluations', value: stats.evaluations.without_evaluation || 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600' },
    { label: 'Seeking Placement', value: stats.placements.seeking || 0, icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compliance Report</h1>
        <button onClick={handleSendReminders} disabled={sending}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center gap-2">
          <Send className="w-4 h-4" />
          {sending ? 'Sending...' : 'Send Overdue Reminders'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('stats')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'stats' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Statistics
        </button>
        <button onClick={() => setTab('missing')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'missing' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Missing Submissions ({missing.length})
        </button>
      </div>

      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${card.color}`}>{card.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'missing' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {missing.length === 0 ? (
            <div className="p-12 text-center text-gray-400">All accepted students have submitted their documents.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Student ID</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Work Report</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {missing.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.full_name}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.student_id}</td>
                    <td className="px-4 py-3 text-center">
                      {s.has_work_report
                        ? <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">Submitted</span>
                        : <span className="text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">Missing</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.has_evaluation
                        ? <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">Submitted</span>
                        : <span className="text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">Missing</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
