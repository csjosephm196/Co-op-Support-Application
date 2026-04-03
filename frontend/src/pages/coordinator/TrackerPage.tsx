import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MapPin } from 'lucide-react';

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
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Placement Tracker</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Accepted co-op students who are seeking or have not yet found a placement.
      </p>

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No tracker entries yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Notes</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.full_name}</p>
                    <p className="text-xs text-gray-400">{e.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.student_number}</td>
                  <td className="px-4 py-3">
                    {editing === e.student_id ? (
                      <select value={editStatus} onChange={(ev) => setEditStatus(ev.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm">
                        <option value="seeking">Seeking</option>
                        <option value="placed">Placed</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize
                        ${e.status === 'placed' ? 'bg-green-100 text-green-700' : e.status === 'withdrawn' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                        {e.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {editing === e.student_id ? (
                      <input value={editNotes} onChange={(ev) => setEditNotes(ev.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full" placeholder="Notes..." />
                    ) : (
                      e.notes || '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editing === e.student_id ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => saveEdit(e.student_id)} className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition">Save</button>
                        <button onClick={() => setEditing(null)} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(e)} className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition">Edit</button>
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
