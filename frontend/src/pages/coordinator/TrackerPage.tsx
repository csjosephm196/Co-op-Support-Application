import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MapPin, Pencil, Save, X } from 'lucide-react';

interface TrackerEntry {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  student_number: string;
  status: string;
  notes: string;
  added_at: string;
}

export default function TrackerPage() {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchTracker = () => {
    api.get('/coordinator/tracker')
      .then(({ data }) => setEntries(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTracker(); }, []);

  const startEdit = (entry: TrackerEntry) => {
    setEditing(entry.student_id);
    setEditStatus(entry.status);
    setEditNotes(entry.notes || '');
  };

  const saveEdit = async (studentId: string) => {
    try {
      await api.put(`/coordinator/tracker/${studentId}`, { status: editStatus, notes: editNotes });
      toast.success('Tracker updated');
      setEditing(null);
      fetchTracker();
    } catch {
      toast.error('Update failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    if (status === 'placed') return 'badge badge-success';
    if (status === 'withdrawn') return 'badge badge-gray';
    return 'badge badge-pending';
  };

  return (
    <div className="page-container fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <h1 className="section-title text-2xl">Placement Tracker</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6 ml-[52px]">
        Accepted co-op students who are seeking or have not yet found a placement.
      </p>

      {entries.length === 0 ? (
        <div className="card p-16 text-center">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No tracker entries yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">ID</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Notes</th>
                <th className="table-header-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="table-cell">
                    <p className="font-semibold text-gray-900">{e.full_name}</p>
                    <p className="text-xs text-gray-400">{e.email}</p>
                  </td>
                  <td className="table-cell text-gray-600 font-mono text-xs">{e.student_number}</td>
                  <td className="table-cell">
                    {editing === e.student_id ? (
                      <select value={editStatus} onChange={(ev) => setEditStatus(ev.target.value)}
                        className="input !w-auto !py-1.5 text-sm">
                        <option value="seeking">Seeking</option>
                        <option value="placed">Placed</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    ) : (
                      <span className={`${statusBadge(e.status)} capitalize`}>{e.status}</span>
                    )}
                  </td>
                  <td className="table-cell text-gray-500 max-w-xs">
                    {editing === e.student_id ? (
                      <input value={editNotes} onChange={(ev) => setEditNotes(ev.target.value)}
                        className="input !py-1.5 text-sm" placeholder="Notes..." />
                    ) : (
                      <span className="truncate block">{e.notes || <span className="text-gray-300">—</span>}</span>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    {editing === e.student_id ? (
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => saveEdit(e.student_id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Save">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditing(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all" title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(e)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
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
