import { useState, useEffect } from 'react';

export default function QrSheet() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQrSheet();
  }, []);

  async function fetchQrSheet() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tables/qr-sheet', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load QR sheet');
      setTables(data.tables);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Action / Instructions Header (Hidden when printing) */}
      <div className="print:hidden bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Printable Table QR Sheet</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30">
              Rule 2 Compliant
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Each QR code contains a cryptographically signed JWT holding the table ID and number.
            Click below to print clean, high-contrast table stand cards.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchQrSheet}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
          >
            🔄 Refresh Tokens
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print QR Cards</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse"></div>
          ))}
        </div>
      ) : (
        /* Printable Cards Container */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4 print:text-black">
          {tables.map((table) => (
            <div
              key={table._id}
              className="bg-white text-gray-950 rounded-2xl p-6 border-2 border-gray-200 shadow-md flex flex-col items-center text-center justify-between print:border-2 print:border-black print:shadow-none print:break-inside-avoid print:p-6"
            >
              {/* Header */}
              <div className="w-full border-b pb-3 mb-3 border-gray-200 print:border-black">
                <div className="text-[10px] font-bold tracking-widest text-orange-600 uppercase print:text-black">
                  Restaurant OS
                </div>
                <div className="text-3xl font-extrabold tracking-tight mt-0.5 text-gray-900 print:text-black">
                  Table {table.number}
                </div>
                <div className="text-xs text-gray-700 font-medium">
                  Seating Capacity: {table.capacity} Persons
                </div>
              </div>

              {/* QR Image */}
              <div className="my-2 p-2 bg-white rounded-xl">
                <img
                  src={table.qrDataUrl}
                  alt={`Table ${table.number} QR`}
                  className="w-44 h-44 object-contain mx-auto"
                />
              </div>

              {/* Scan Instructions */}
              <div className="w-full pt-3 mt-2 border-t border-gray-200 print:border-black space-y-1">
                <div className="text-xs font-bold text-gray-900 uppercase tracking-wide print:text-black">
                  Scan to View Menu & Order
                </div>
                <div className="text-[10px] text-gray-700">
                  Point phone camera • No app download required
                </div>
                <div className="text-[9px] text-gray-700 font-mono truncate select-none print:hidden">
                  Token: {table.qrToken.slice(0, 16)}…
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
