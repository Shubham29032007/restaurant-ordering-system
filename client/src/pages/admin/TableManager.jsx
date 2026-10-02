import { useState, useEffect } from 'react';

const STATUS_CONFIG = {
  FREE: {
    label: 'Free',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  OCCUPIED: {
    label: 'Occupied',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  BILLED: {
    label: 'Billed',
    color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    dot: 'bg-sky-500',
  },
  CLEANING: {
    label: 'Cleaning',
    color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-500',
  },
};

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Add Table Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ number: '', capacity: 4 });
  const [submitting, setSubmitting] = useState(false);

  // QR Modal
  const [qrModalTable, setQrModalTable] = useState(null);
  const [qrSheetData, setQrSheetData] = useState({}); // map of tableId -> qrDataUrl

  useEffect(() => {
    fetchTables();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function fetchTables() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // Fetch table list and QR sheet simultaneously
      const [tablesRes, qrRes] = await Promise.all([
        fetch('/api/tables', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tables/qr-sheet', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const tablesData = await tablesRes.json();
      const qrData = await qrRes.json();

      if (!tablesData.success) throw new Error(tablesData.error || 'Failed to fetch tables');
      setTables(tablesData.tables);

      if (qrData.success && qrData.tables) {
        const qrMap = {};
        qrData.tables.forEach((t) => {
          qrMap[t._id] = t.qrDataUrl;
        });
        setQrSheetData(qrMap);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(tableId, newStatus) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update table');

      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? { ...t, status: data.table.status } : t))
      );
      showToast(`Table status updated to ${newStatus}`);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCapacityChange(tableId, newCapacity) {
    const cap = parseInt(newCapacity, 10);
    if (!cap || cap < 1) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tables/${tableId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ capacity: cap }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update capacity');

      setTables((prev) =>
        prev.map((t) => (t._id === tableId ? { ...t, capacity: data.table.capacity } : t))
      );
      showToast(`Table capacity updated`);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRegenerateQR(table) {
    if (!window.confirm(`Regenerate QR token for Table ${table.number}? Existing printed QR will become invalid.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tables/${table._id}/regenerate-qr`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to regenerate QR');

      showToast(`New QR code generated for Table ${table.number}`);
      // Refresh table and QR sheet data
      fetchTables();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddTable(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          number: parseInt(addForm.number, 10),
          capacity: parseInt(addForm.capacity, 10),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create table');

      showToast(`Created Table #${data.table.number}`);
      setIsAddOpen(false);
      setAddForm({ number: '', capacity: 4 });
      fetchTables();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Summary counts
  const freeCount = tables.filter((t) => t.status === 'FREE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const billedCount = tables.filter((t) => t.status === 'BILLED').length;
  const cleaningCount = tables.filter((t) => t.status === 'CLEANING').length;

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-gray-950 font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Table Manager</span>
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
              {tables.length} tables total
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Monitor dining area capacity, live table occupancy, and signed QR security (Rule 2).
          </p>
        </div>
        <button
          onClick={() => {
            const nextNumber = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
            setAddForm({ number: nextNumber, capacity: 4 });
            setIsAddOpen(true);
          }}
          className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-400 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Table</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Free</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{freeCount}</div>
          </div>
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Occupied</div>
            <div className="text-2xl font-bold text-amber-400 mt-0.5">{occupiedCount}</div>
          </div>
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
        </div>
        <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Billed</div>
            <div className="text-2xl font-bold text-sky-400 mt-0.5">{billedCount}</div>
          </div>
          <span className="w-3 h-3 rounded-full bg-sky-500"></span>
        </div>
        <div className="bg-gray-900 border border-gray-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cleaning</div>
            <div className="text-2xl font-bold text-purple-400 mt-0.5">{cleaningCount}</div>
          </div>
          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse p-5"></div>
          ))}
        </div>
      ) : (
        /* Tables Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => {
            const statusMeta = STATUS_CONFIG[table.status] || STATUS_CONFIG.FREE;
            const qrDataUrl = qrSheetData[table._id];

            return (
              <div
                key={table._id}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  {/* Top Bar: Table Number & Status Pill */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">🪑</span>
                      <span className="text-lg font-bold text-white tracking-tight">
                        Table {table.number}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                      <span>{statusMeta.label}</span>
                    </span>
                  </div>

                  {/* Seating Capacity Selector */}
                  <div className="flex items-center justify-between py-2 border-y border-gray-800/80 my-2 text-xs text-gray-400">
                    <span className="flex items-center space-x-1">
                      <span>👥 Seating Capacity:</span>
                    </span>
                    <select
                      value={table.capacity}
                      onChange={(e) => handleCapacityChange(table._id, e.target.value)}
                      className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {[2, 4, 6, 8, 10, 12].map((num) => (
                        <option key={num} value={num}>
                          {num} Seats
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Dropdown */}
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                      Quick Status Change
                    </label>
                    <select
                      value={table.status}
                      onChange={(e) => handleStatusChange(table._id, e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      <option value="FREE">FREE (Available)</option>
                      <option value="OCCUPIED">OCCUPIED (Dining)</option>
                      <option value="BILLED">BILLED (Awaiting Pay)</option>
                      <option value="CLEANING">CLEANING (Turnover)</option>
                    </select>
                  </div>
                </div>

                {/* Bottom QR Action Bar */}
                <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setQrModalTable({ ...table, qrDataUrl })}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span>View QR Code</span>
                  </button>

                  <button
                    onClick={() => handleRegenerateQR(table)}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition"
                    title="Regenerate QR token (Signed JWT - Rule 2)"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Table Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add New Table</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Table Number *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addForm.number}
                  onChange={(e) => setAddForm({ ...addForm, number: e.target.value })}
                  placeholder="e.g. 13"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Seating Capacity *
                </label>
                <select
                  value={addForm.capacity}
                  onChange={(e) => setAddForm({ ...addForm, capacity: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  {[2, 4, 6, 8, 10, 12, 16].map((num) => (
                    <option key={num} value={num}>
                      {num} People
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[11px] text-gray-400 bg-gray-950 p-3 rounded-xl border border-gray-800">
                🔒 Table QR JWT token will automatically be signed server-side with <code className="text-orange-400">QR_JWT_SECRET</code> upon creation (Rule 2).
              </p>

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
                  {submitting ? 'Creating…' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Inspection Modal */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Table #{qrModalTable.number} QR Code
              </h3>
              <button
                onClick={() => setQrModalTable(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
              {qrModalTable.qrDataUrl ? (
                <img
                  src={qrModalTable.qrDataUrl}
                  alt={`Table ${qrModalTable.number} QR`}
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400 text-xs">
                  Generating QR…
                </div>
              )}
            </div>

            <div className="text-left bg-gray-950 p-3 rounded-xl border border-gray-800 text-xs text-gray-400 space-y-1">
              <div className="font-semibold text-gray-300">Signed Direct URL (Rule 2):</div>
              <div className="text-[11px] font-mono text-orange-400 break-all select-all">
                {window.location.origin}/t/{qrModalTable.qrToken}
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <a
                href={qrModalTable.qrDataUrl}
                download={`table-${qrModalTable.number}-qr.png`}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-white transition"
              >
                <span>💾 Download PNG</span>
              </a>
              <a
                href={`/t/${qrModalTable.qrToken}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-white transition"
              >
                <span>🔗 Test Surface</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
