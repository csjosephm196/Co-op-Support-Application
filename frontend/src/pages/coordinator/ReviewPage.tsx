import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ChevronDown, Check, X, Eye, XCircle } from 'lucide-react';

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
      .then((results) => {
        const all = results.flatMap((r) => r.data);
        setApps(all);
      })
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
    setConfirm(null);
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

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Application Review</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('provisional')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'provisional' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Provisional Review
        </button>
        <button onClick={() => setTab('final')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'final' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Final Review
        </button>
      </div>

      {tab === 'final' && apps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-600 font-medium">Bulk Actions:</span>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={selectedIds.size === apps.length && apps.length > 0} onChange={toggleAll} className="rounded" />
            Select All
          </label>
          <select value={bulkDecision} onChange={(e) => setBulkDecision(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
            <option value="">Choose action...</option>
            <option value="finally_accepted">Accept All Selected</option>
            <option value="finally_rejected">Reject All Selected</option>
          </select>
          <button onClick={handleBulkFinal}
            className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition">
            Apply
          </button>
          <span className="text-xs text-gray-400">{selectedIds.size} selected</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading applications...</div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No applications pending {tab} review.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {tab === 'final' && <th className="px-4 py-3 text-left w-10"></th>}
                <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Program</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">GPA</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  {tab === 'final' && (
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)} className="rounded" />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.student_name}</p>
                    <p className="text-xs text-gray-400">{a.student_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.program}</td>
                  <td className="px-4 py-3">
                    <span className={a.gpa < 3.0 ? 'text-red-600 font-medium' : 'text-gray-600'}>{a.gpa}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 capitalize">
                      {a.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} title="Expand"
                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      {tab === 'provisional' ? (
                        <>
                          <button onClick={() => setConfirm({ id: a.id, decision: 'provisionally_accepted' })} title="Accept"
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirm({ id: a.id, decision: 'provisionally_rejected' })} title="Reject"
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setConfirm({ id: a.id, decision: a.status === 'provisionally_accepted' ? 'finally_accepted' : 'finally_rejected' })} title="Confirm Provisional"
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition">
                            <Check className="w-4 h-4" />
                          </button>
                          <select onChange={(e) => { if (e.target.value) setConfirm({ id: a.id, decision: e.target.value }); }}
                            value="" className="text-xs border border-gray-300 rounded px-1 py-1">
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

      {/* Lightbox for expanded application */}
      {expanded && (() => {
        const a = apps.find((x) => x.id === expanded);
        if (!a) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl p-8 relative">
              <button onClick={() => setExpanded(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold mb-4">{a.student_name}'s Application</h2>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium">{a.student_email}</span></div>
                  <div><span className="text-gray-500">Student ID:</span> <span className="font-medium">{a.student_number}</span></div>
                  <div><span className="text-gray-500">GPA:</span> <span className={`font-medium ${a.gpa < 3.0 ? 'text-red-600' : ''}`}>{a.gpa}</span></div>
                  <div><span className="text-gray-500">Program:</span> <span className="font-medium">{a.program}</span></div>
                  <div><span className="text-gray-500">Year:</span> <span className="font-medium">{a.year_of_study}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{a.phone || 'N/A'}</span></div>
                </div>
                {a.address && <div><span className="text-gray-500">Address:</span> <p className="font-medium mt-1">{a.address}</p></div>}
                {a.cover_letter && <div><span className="text-gray-500">Cover Letter:</span> <p className="mt-1 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{a.cover_letter}</p></div>}
                {a.additional_info && <div><span className="text-gray-500">Additional Info:</span> <p className="mt-1 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{a.additional_info}</p></div>}
              </div>
              <div className="mt-6 flex gap-3">
                {tab === 'provisional' ? (
                  <>
                    <button onClick={() => { setExpanded(null); setConfirm({ id: a.id, decision: 'provisionally_accepted' }); }}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">Accept</button>
                    <button onClick={() => { setExpanded(null); setConfirm({ id: a.id, decision: 'provisionally_rejected' }); }}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">Reject</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setExpanded(null); setConfirm({ id: a.id, decision: 'finally_accepted' }); }}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">Final Accept</button>
                    <button onClick={() => { setExpanded(null); setConfirm({ id: a.id, decision: 'finally_rejected' }); }}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">Final Reject</button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold mb-2">Confirm Decision</h2>
            <p className="text-gray-500 text-sm mb-6">
              {confirm.decision.includes('accepted') ? 'Accept' : 'Reject'} this application? {tab === 'final' && 'The student will be notified by email.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => tab === 'provisional' ? handleProvisionalDecision(confirm.id, confirm.decision) : handleFinalDecision(confirm.id, confirm.decision)}
                className={`flex-1 py-2 text-white rounded-lg font-medium transition ${confirm.decision.includes('accepted') ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
