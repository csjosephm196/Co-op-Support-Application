import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Check, X, Eye, XCircle, ClipboardCheck, ListChecks } from 'lucide-react';

interface Application {
  id: string;
  student_name: string;
  student_email: string;
  student_number: string;
  status: string;
  gpa: number;
  program: string;
  year_of_study: number;
  cover_letter: string;
  additional_info: string;
  phone: string;
  address: string;
  submitted_at: string;
}

type Tab = 'provisional' | 'final';

export default function ReviewPage() {
  const [tab, setTab] = useState<Tab>('provisional');
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; decision: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDecision, setBulkDecision] = useState('');

  const fetchApps = () => {
    setLoading(true);
    const status = tab === 'provisional' ? 'pending' : 'provisionally_accepted,provisionally_rejected';
    const promises = status.split(',').map((s) => api.get(`/applications?status=${s}`));
    Promise.all(promises)
      .then((results) => setApps(results.flatMap((r) => r.data)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApps(); setSelectedIds(new Set()); }, [tab]);

  const handleProvisionalDecision = async (id: string, decision: string) => {
    setConfirm(null);
    try {
      await api.post('/coordinator/review/provisional', { applicationId: id, decision });
      toast.success('Decision saved');
      fetchApps();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleFinalDecision = async (id: string, decision: string) => {
    setConfirm(null);
    try {
      await api.post('/coordinator/review/final', { applicationId: id, decision });
      toast.success('Final decision saved & student notified');
      fetchApps();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleBulkFinal = async () => {
    if (selectedIds.size === 0) { toast.error('No applications selected'); return; }
    if (!bulkDecision) { toast.error('Select a decision'); return; }
    try {
      await api.post('/coordinator/review/bulk-final', {
        applicationIds: Array.from(selectedIds),
        decision: bulkDecision,
      });
      toast.success(`${selectedIds.size} application(s) processed`);
      setSelectedIds(new Set());
      setBulkDecision('');
      fetchApps();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Bulk action failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === apps.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(apps.map((a) => a.id)));
  };

  const statusBadge = (status: string) => {
    if (status === 'provisionally_accepted') return 'badge badge-success';
    if (status === 'provisionally_rejected') return 'badge badge-danger';
    return 'badge badge-pending';
  };

  return (
    <div className="page-container fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <ClipboardCheck className="w-5 h-5 text-white" />
        </div>
        <h1 className="section-title text-2xl">Application Review</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100/80 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('provisional')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'provisional' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
          Provisional Review
        </button>
        <button onClick={() => setTab('final')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'final' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
          Final Review
        </button>
      </div>

      {tab === 'final' && apps.length > 0 && (
        <div className="card p-4 mb-4 flex items-center gap-3 flex-wrap">
          <ListChecks className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 font-semibold">Bulk Actions:</span>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={selectedIds.size === apps.length && apps.length > 0} onChange={toggleAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            Select All
          </label>
          <select value={bulkDecision} onChange={(e) => setBulkDecision(e.target.value)} className="input !w-auto !py-1.5 text-sm">
            <option value="">Choose action...</option>
            <option value="finally_accepted">Accept All Selected</option>
            <option value="finally_rejected">Reject All Selected</option>
          </select>
          <button onClick={handleBulkFinal} className="btn-primary text-sm !py-1.5">Apply</button>
          <span className="badge badge-info">{selectedIds.size} selected</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : apps.length === 0 ? (
        <div className="card p-16 text-center">
          <ClipboardCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No applications pending {tab} review.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                {tab === 'final' && <th className="table-header-cell w-10"></th>}
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Program</th>
                <th className="table-header-cell">GPA</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  {tab === 'final' && (
                    <td className="table-cell">
                      <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                  )}
                  <td className="table-cell">
                    <p className="font-semibold text-gray-900">{a.student_name}</p>
                    <p className="text-xs text-gray-400">{a.student_email}</p>
                  </td>
                  <td className="table-cell text-gray-600">{a.program}</td>
                  <td className="table-cell">
                    <span className={`font-semibold ${a.gpa < 3.0 ? 'text-red-600' : 'text-gray-900'}`}>{a.gpa}</span>
                  </td>
                  <td className="table-cell">
                    <span className={statusBadge(a.status)}>
                      {a.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} title="View Details"
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      {tab === 'provisional' ? (
                        <>
                          <button onClick={() => setConfirm({ id: a.id, decision: 'provisionally_accepted' })} title="Accept"
                            className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirm({ id: a.id, decision: 'provisionally_rejected' })} title="Reject"
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setConfirm({ id: a.id, decision: a.status === 'provisionally_accepted' ? 'finally_accepted' : 'finally_rejected' })} title="Confirm Provisional"
                            className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all">
                            <Check className="w-4 h-4" />
                          </button>
                          <select onChange={(e) => { if (e.target.value) setConfirm({ id: a.id, decision: e.target.value }); }}
                            value="" className="input !w-auto !py-1 !px-2 text-xs">
                            <option value="">Change...</option>
                            <option value="finally_accepted">Accept</option>
                            <option value="finally_rejected">Reject</option>
                          </select>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expanded && (() => {
        const a = apps.find((x) => x.id === expanded);
        if (!a) return null;
        return (
          <div className="modal-overlay">
            <div className="modal-content max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 relative">
              <button onClick={() => setExpanded(null)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-5">{a.student_name}&apos;s Application</h2>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Email', a.student_email],
                    ['Student ID', a.student_number],
                    ['GPA', a.gpa, a.gpa < 3.0 ? 'text-red-600 font-bold' : ''],
                    ['Program', a.program],
                    ['Year', a.year_of_study],
                    ['Phone', a.phone || 'N/A'],
                  ].map(([label, value, cls]) => (
                    <div key={label as string} className="bg-gray-50 rounded-lg p-3">
                      <span className="text-gray-400 text-xs">{label as string}</span>
                      <p className={`font-semibold text-gray-900 ${cls || ''}`}>{value as string}</p>
                    </div>
                  ))}
                </div>
                {a.address && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-400 text-xs">Address</span>
                    <p className="font-semibold text-gray-900">{a.address}</p>
                  </div>
                )}
                {a.cover_letter && (
                  <div>
                    <span className="text-gray-400 text-xs">Cover Letter</span>
                    <p className="mt-1 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-gray-700">{a.cover_letter}</p>
                  </div>
                )}
                {a.additional_info && (
                  <div>
                    <span className="text-gray-400 text-xs">Additional Info</span>
                    <p className="mt-1 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-gray-700">{a.additional_info}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                {tab === 'provisional' ? (
                  <>
                    <button onClick={() => { setExpanded(null); setConfirm({ id: a.id, decision: 'provisionally_accepted' }); }}
                      className="btn-success flex-1">Accept</button>
                    <button onClick={() => { setExpanded(null); setConfirm({ id: a.id, decision: 'provisionally_rejected' }); }}
                      className="btn-danger flex-1">Reject</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setExpanded(null); setConfirm({ id: a.id, decision: 'finally_accepted' }); }}
                      className="btn-success flex-1">Final Accept</button>
                    <button onClick={() => { setExpanded(null); setConfirm({ id: a.id, decision: 'finally_rejected' }); }}
                      className="btn-danger flex-1">Final Reject</button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {confirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="modal-content p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirm Decision</h2>
            <p className="text-gray-500 text-sm mb-6">
              {confirm.decision.includes('accepted') ? 'Accept' : 'Reject'} this application? {tab === 'final' && 'The student will be notified by email.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => tab === 'provisional' ? handleProvisionalDecision(confirm.id, confirm.decision) : handleFinalDecision(confirm.id, confirm.decision)}
                className={`flex-1 ${confirm.decision.includes('accepted') ? 'btn-success' : 'btn-danger'}`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
