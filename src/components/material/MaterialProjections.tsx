// src/components/material/MaterialProjections.tsx
import { useMemo, useState } from 'react';
import { CalendarClock, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { formatNumber } from '@/utils/numberFormatter';
import type { MaterialAvailabilityResult } from '@/utils/dataProcessor';
import SortIcon, { type SortDirection } from '../sort/SortIcon';

type MaterialProjectionsProps = {
  data: MaterialAvailabilityResult;
};

export default function MaterialProjections({
  data,
}: MaterialProjectionsProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const { weekKeys, projections } = data;

  // --- Search: by name, materialId, or buyer ---
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return projections;
    const q = searchQuery.toLowerCase();
    return projections.filter(
      (row) =>
        (row.name ?? '').toLowerCase().includes(q) ||
        (row.materialId ?? '').toLowerCase().includes(q) ||
        (row.buyer ?? '').toLowerCase().includes(q),
    );
  }, [projections, searchQuery]);

  // --- Sort: by name ---
  const sortedData = useMemo(() => {
    if (!sortDirection) return filteredData;
    return [...filteredData].sort((a, b) => {
      const strA = String(a.name ?? '');
      const strB = String(b.name ?? '');
      return sortDirection === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [filteredData, sortDirection]);

  const handleSort = () => {
    setSortDirection((prev) => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null; // reset
    });
  };

  if (!projections.length) return null;

  return (
    <div className="overflow-hidden bg-white rounded-xl border shadow-xs border-slate-100">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <div className="flex flex-col gap-3 justify-between sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Proyeksi Ketersediaan Komponen & Jadwal MRP
            </h3>
            <p className="text-xs text-slate-500">
              Proyeksi akumulasi stok mingguan dengan simulasi Lead Time.
            </p>
          </div>
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            />
            <input
              id="material-search"
              type="text"
              placeholder="Cari nama, ID material, buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2 pr-3 pl-9 w-full text-xs rounded-lg border transition-colors border-slate-200 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
        {/* Result count */}
        {searchQuery.trim() && (
          <p className="mt-2 text-xs text-slate-400">
            Menampilkan {sortedData.length} dari {projections.length} baris
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-300">
          <thead>
            <tr className="font-semibold uppercase border-b bg-slate-100 text-slate-600 border-slate-200">
              <th
                className="sticky left-0 z-10 p-3 w-40 bg-slate-100 cursor-pointer select-none hover:bg-slate-200 transition-colors"
                onClick={handleSort}
              >
                Material & Detail
                <SortIcon direction={sortDirection} />
              </th>
              <th className="p-3 text-right">Stok Awal</th>
              <th className="p-3 text-center">UOM</th>
              <th className="p-3 text-center">Est. Material Habis</th>
              <th className="p-3 font-bold text-center text-amber-900 bg-amber-50">
                Week to Buy
              </th>
              {weekKeys.map((wk) => (
                <th key={wk} className="p-3 font-mono text-center">
                  {wk}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={5 + weekKeys.length}
                  className="p-8 text-sm text-center text-slate-400"
                >
                  Tidak ada data yang cocok dengan pencarian &quot;{searchQuery}
                  &quot;
                </td>
              </tr>
            ) : (
              sortedData.map((proj, idx) => {
                const isUrgent = proj.orderTriggerWeek === 'OVERDUE';
                const isSafe = proj.shortageWeek.includes('Safe');

                return (
                  <tr
                    key={proj.materialId ?? idx}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="sticky left-0 z-10 p-3 bg-white shadow-md">
                      <div className="font-bold text-slate-800">
                        {proj.name}
                      </div>
                      <div className="font-semibold text-[10px] text-slate-600 max-w-xs truncate">
                        ({proj.color})
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {proj.materialId}
                      </div>
                      <div className="text-[9px] text-indigo-600 font-semibold uppercase">
                        {proj.buyer}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-right text-slate-700">
                      {formatNumber(proj.initialStock)}
                    </td>
                    <td className="p-3 text-center text-slate-700">
                      {proj.unit}
                    </td>
                    <td className="p-3 text-center">
                      {isSafe ? (
                        <span className="px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 font-medium inline-flex items-center gap-1">
                          <ShieldCheck size={12} /> Aman
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-sm bg-red-50 text-red-700 font-semibold inline-flex items-center gap-1">
                          <ShieldAlert size={12} /> {proj.shortageWeek}
                        </span>
                      )}
                    </td>
                    <td
                      className={`p-3 text-center font-bold ${isUrgent ? 'text-red-700 bg-red-100 animate-pulse' : isSafe ? 'bg-slate-50 text-slate-400' : 'text-amber-700 bg-amber-50'}`}
                    >
                      <div className="flex gap-1 justify-center items-center">
                        {!isSafe && <CalendarClock size={12} />}
                        {proj.orderTriggerWeek}
                      </div>
                      {!isSafe && (
                        <div className="text-[9px] font-normal text-slate-500">
                          Leadtime Target: {proj.totalLtWeeks}W
                        </div>
                      )}
                    </td>
                    {proj.timeline.map((t, tIdx) => (
                      <td
                        key={`${proj.materialId}-${t.week}-${tIdx}`}
                        className={`p-2 text-center font-mono border-l border-slate-50 ${t.closingStock < 0 ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-600'}`}
                      >
                        <div className="text-[10px]">
                          {formatNumber(t.closingStock)}
                        </div>
                        {t.demand > 0 && (
                          <div className="text-[8px] text-slate-400">
                            Req: {formatNumber(t.demand)}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
