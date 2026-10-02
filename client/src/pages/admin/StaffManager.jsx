import { useState, useEffect } from 'react';

const ROLE_CONFIG = {
  ADMIN: {
    label: 'Admin',
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
  CHEF: {
    label: 'Kitchen Chef',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  STAFF: {
    label: 'Floor Staff / Waiter',
    color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
};

export default function StaffManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF',
    active: true,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    role: 'STAFF',
    active: true,
    password: '',
  });

  // Current logged in user to prevent self-lockout
  const currentAdmin = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    fetchUsers();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function fetchUsers() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create user');

      setUsers((prev) => [...prev, data.user]);
      showToast(`Account created for ${data.user.name}`);
      setIsAddOpen(false);
      setAddForm({ name: '', email: '', password: '', role: 'STAFF', active: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(u) {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      role: u.role,
      active: u.active,
      password: '',
    });
  }

  async function handleEditUser(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: editForm.name,
        role: editForm.role,
        active: editForm.active,
      };
      if (editForm.password && editForm.password.trim().length > 0) {
        payload.password = editForm.password.trim();
      }

      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update user');

      setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? data.user : u)));
      showToast(`Updated ${data.user.name}`);
      setEditingUser(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(user) {
    if (user._id === currentAdmin._id) {
      alert('You cannot deactivate your currently logged-in account.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !user.active }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update user');

      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, active: data.user.active } : u))
      );
      showToast(`${user.name} is now ${data.user.active ? 'Active' : 'Inactive'}`);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-gray-950 font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Staff & Accounts</span>
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
              {users.length} members
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage credentials, surface access roles (ADMIN, CHEF, STAFF), and active logins.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-400 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Team Member</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading staff accounts…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950/60 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {users.map((u) => {
                  const roleMeta = ROLE_CONFIG[u.role] || { label: u.role, color: 'bg-gray-800 text-gray-400 border-gray-700' };
                  const isCurrent = u._id === currentAdmin._id;

                  return (
                    <tr key={u._id} className="hover:bg-gray-800/40 transition">
                      <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">ID: {u._id.slice(-6)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleMeta.color}`}
                        >
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <label className="inline-flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            disabled={isCurrent}
                            checked={u.active}
                            onChange={() => handleToggleActive(u)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative disabled:opacity-40"></div>
                          <span
                            className={`text-xs font-semibold ${
                              u.active ? 'text-emerald-400' : 'text-gray-500'
                            }`}
                          >
                            {u.active ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 transition"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add Team Member</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="john@restaurant.local"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Surface Access Role *
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="STAFF">Floor Staff / Waiter (/staff)</option>
                  <option value="CHEF">Kitchen Chef (/kitchen)</option>
                  <option value="ADMIN">Manager / Admin (/admin)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 transition"
                >
                  {submitting ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit Team Member</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="STAFF">Floor Staff / Waiter (/staff)</option>
                  <option value="CHEF">Kitchen Chef (/kitchen)</option>
                  <option value="ADMIN">Manager / Admin (/admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="New password (optional)"
                  minLength={6}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Account Active</span>
                <input
                  type="checkbox"
                  disabled={editingUser._id === currentAdmin._id}
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-gray-950 border-gray-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 transition"
                >
                  {submitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
