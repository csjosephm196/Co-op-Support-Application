import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { BarChart3, AlertTriangle, Send, Users, FileText, Briefcase, CheckCircle, XCircle } from 'lucide-react';

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
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = stats ? [
    { label: 'Total Students', value: stats.totalStudents, icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600', ring: 'ring-blue-500/10' },
    { label: 'Pending Applications', value: stats.applications.pending || 0, icon: <FileText className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600', ring: 'ring-amber-500/10' },
    { label: 'Accepted', value: stats.applications.finally_accepted || 0, icon: <Briefcase className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-500/10' },
    { label: 'Missing Reports', value: stats.reports.without_report || 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-50 text-red-600', ring: 'ring-red-500/10' },
    { label: 'Missing Evaluations', value: stats.evaluations.without_evaluation || 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600', ring: 'ring-orange-500/10' },
    { label: 'Seeking Placement', value: stats.placements.seeking || 0, icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600', ring: 'ring-purple-500/10' },
  ] : [];

  return (
    <div className="page-container fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h1 className="section-title text-2xl">Compliance Report</h1>
        </div>
        <button onClick={handleSendReminders} disabled={sending}
          className="btn-primary text-sm flex items-center gap-2">
          <Send className="w-4 h-4" />
          {sending ? 'Sending...' : 'Send Reminders'}
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100/80 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('stats')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'stats' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
          Statistics
        </button>
        <button onClick={() => setTab('missing')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'missing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
          Missing Submissions
          {missing.length > 0 && <span className="ml-1.5 badge badge-danger text-[10px]">{missing.length}</span>}
        </button>
      </div>

      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card, i) => (
            <div key={card.label} className={`stat-card ${i < 3 ? 'fade-in' : 'fade-in-delay'}`}>
              <div className={`stat-icon ${card.color} ring-4 ${card.ring}`}>{card.icon}</div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'missing' && (
        <div className="card overflow-hidden">
          {missing.length === 0 ? (
            <div className="p-16 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
              <p className="text-gray-400">All accepted students have submitted their documents.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Student</th>
                  <th className="table-header-cell">Student ID</th>
                  <th className="table-header-cell text-center">Work Report</th>
                  <th className="table-header-cell text-center">Evaluation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {missing.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-cell">
                      <p className="font-semibold text-gray-900">{s.full_name}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </td>
                    <td className="table-cell text-gray-600 font-mono text-xs">{s.student_id}</td>
                    <td className="table-cell text-center">
                      {s.has_work_report
                        ? <span className="badge badge-success"><CheckCircle className="w-3 h-3" /> Submitted</span>
                        : <span className="badge badge-danger"><XCircle className="w-3 h-3" /> Missing</span>}
                    </td>
                    <td className="table-cell text-center">
                      {s.has_evaluation
                        ? <span className="badge badge-success"><CheckCircle className="w-3 h-3" /> Submitted</span>
                        : <span className="badge badge-danger"><XCircle className="w-3 h-3" /> Missing</span>}
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
