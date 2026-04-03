import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Mail, UserPlus } from 'lucide-react';

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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Invitations</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Send Invitation
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">New Invitation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="jane@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
                <option value="employer">Employer</option>
                <option value="coordinator">Coordinator</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setShowConfirm(true)} disabled={sending || !form.fullName || !form.email}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center gap-2">
              <Mail className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Invitation'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {invitations.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No invitations sent yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Invited By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{inv.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.email}</td>
                    <td className="px-4 py-3 capitalize">{inv.role}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize
                        ${inv.status === 'accepted' ? 'bg-green-100 text-green-700' : inv.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{inv.invited_by_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold mb-2">Confirm Invitation</h2>
            <p className="text-gray-500 text-sm mb-4">
              Send an onboarding invitation to <strong>{form.fullName}</strong> ({form.email}) as a <strong>{form.role}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSend} className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
