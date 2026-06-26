// src/components/SelectionTable.jsx
import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { formatNumber } from '@/utils/numberFormatter';

const COLUMNS = [
  { key: 'season', label: 'Season', align: 'left' },
  { key: 'modelCode', label: 'Model Code', align: 'left' },
  { key: 'style', label: 'Style', align: 'left' },
  { key: 'selectionQty', label: 'Sum of Selection', align: 'right' },
  { key: 'orderQty', label: 'Qty Order', align: 'right' },
  { key: 'forecastQty', label: 'Total Forecast', align: 'right' },
  { key: 'remainingSelection', label: 'Sisa Selection', align: 'right' },
  { key: 'status', label: 'Status', align: 'center' },
];

function SortIcon({ direction }) {
  if (direction === 'asc') return <ArrowUp size={12} className="inline ml-1" />;
  if (direction === 'desc')
    return <ArrowDown size={12} className="inline ml-1" />;
  return <ArrowUpDown size={12} className="inline ml-1 opacity-30" />;
}

export default function SelectionTable({ data }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null }); // null | 'asc' | 'desc'

  // --- Search ---
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (row) =>
        row.season.toLowerCase().includes(q) ||
        row.modelCode.toLowerCase().includes(q) ||
        row.style.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  // --- Sort ---
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData;

    const { key, direction } = sortConfig;
    const sorted = [...filteredData].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      // Numeric comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction === 'asc' ? valA - valB : valB - valA;
      }

      // String comparison
      const strA = String(valA ?? '');
      const strB = String(valB ?? '');
      return direction === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null }; // reset
    });
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-hidden mb-6 bg-white rounded-xl border shadow-xs border-slate-100">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <div className="flex flex-col gap-3 justify-between sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Hasil Perhitungan Sisa Selection
            </h3>
            <p className="text-xs text-slate-500">
              Analisis deviasi antara target musiman (Selection) vs Pesanan
              Masuk (Order) + Forecast.
            </p>
          </div>
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            />
            <input
              id="selection-search"
              type="text"
              placeholder="Cari season, model, style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2 pr-3 pl-9 w-full text-xs rounded-lg border transition-colors border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
        {/* Result count */}
        {searchQuery.trim() && (
          <p className="mt-2 text-xs text-slate-400">
            Menampilkan {sortedData.length} dari {data.length} baris
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="font-semibold uppercase border-b bg-slate-100 text-slate-600 border-slate-200">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`p-3 cursor-pointer select-none hover:bg-slate-200 transition-colors ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : ''
                  }`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon
                    direction={
                      sortConfig.key === col.key ? sortConfig.direction : null
                    }
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="p-8 text-sm text-center text-slate-400"
                >
                  Tidak ada data yang cocok dengan pencarian "{searchQuery}"
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr key={idx} className="transition-colors hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-700 bg-slate-50">
                    {row.season}
                  </td>
                  <td className="p-3 font-mono font-medium text-slate-600 bg-slate-50">
                    {row.modelCode}
                  </td>
                  <td className="p-3 font-medium uppercase text-slate-700 bg-slate-50">
                    {row.style}
                  </td>
                  <td className="p-3 font-semibold text-right">
                    {formatNumber(row.selectionQty)}
                  </td>
                  <td className="p-3 text-right text-amber-600">
                    {formatNumber(row.orderQty)}
                  </td>
                  <td className="p-3 text-right text-blue-600">
                    {formatNumber(row.forecastQty)}
                  </td>
                  <td
                    className={`p-3 text-right font-bold ${row.remainingSelection < 0 ? 'text-red-600' : 'text-emerald-600'}`}
                  >
                    {formatNumber(row.remainingSelection)}
                  </td>
                  <td className="p-3 text-center">
                    {row.remainingSelection < 0 ? (
                      <span className="inline-flex gap-1 items-center px-2 py-1 font-medium text-red-700 bg-red-50 rounded-sm">
                        <AlertTriangle size={12} /> Over-Consumed
                      </span>
                    ) : (
                      <span className="inline-flex gap-1 items-center px-2 py-1 font-medium text-emerald-700 bg-emerald-50 rounded-sm">
                        <CheckCircle size={12} /> Aman
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
