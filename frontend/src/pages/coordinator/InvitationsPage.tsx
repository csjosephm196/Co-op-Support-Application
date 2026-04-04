import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Mail, UserPlus, Send } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
  invited_by_name: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', role: 'employer' });
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchInvitations = () => {
    api.get('/invitations')
      .then(({ data }) => setInvitations(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvitations(); }, []);

  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);
    try {
      await api.post('/invitations', form);
      toast.success('Invitation sent!');
      setShowForm(false);
      setForm({ fullName: '', email: '', role: 'employer' });
      fetchInvitations();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'accepted') return 'badge badge-success';
    if (status === 'expired') return 'badge badge-danger';
    return 'badge badge-pending';
  };

  return (
    <div className="max-w-5xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm">
            <Send className="w-5 h-5 text-white" />
          </div>
          <h1 className="section-title text-2xl">Onboarding Invitations</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> New Invitation
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 fade-in">
          <h2 className="text-lg font-bold mb-4">Send New Invitation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input" placeholder="jane@company.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
                <option value="employer">Employer</option>
                <option value="coordinator">Coordinator</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button onClick={() => setShowConfirm(true)} disabled={sending || !form.fullName || !form.email}
              className="btn-primary text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Invitation'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {invitations.length === 0 ? (
            <div className="p-16 text-center">
              <Mail className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No invitations sent yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Role</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Invited By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-cell font-semibold text-gray-900">{inv.full_name}</td>
                    <td className="table-cell text-gray-600">{inv.email}</td>
                    <td className="table-cell">
                      <span className="badge badge-info capitalize">{inv.role}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`${statusBadge(inv.status)} capitalize`}>{inv.status}</span>
                    </td>
                    <td className="table-cell text-gray-400">{inv.invited_by_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirm Invitation</h2>
            <p className="text-gray-500 text-sm mb-4">
              Send an onboarding invitation to <strong className="text-gray-700">{form.fullName}</strong> ({form.email}) as a <strong className="text-gray-700">{form.role}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSend} className="btn-primary flex-1">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
