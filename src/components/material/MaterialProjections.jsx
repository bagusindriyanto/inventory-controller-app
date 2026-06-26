// src/components/MaterialProjections.jsx
import { CalendarClock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { formatNumber } from '@/utils/numberFormatter';

export default function MaterialProjections({ data }) {
  if (!data || !data.projections || data.projections.length === 0) return null;

  const { weekKeys, projections } = data;

  return (
    <div className="overflow-hidden bg-white rounded-xl border shadow-xs border-slate-100">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <h3 className="text-base font-bold text-slate-800">
          Proyeksi Ketersediaan Komponen & Jadwal MRP
        </h3>
        <p className="text-xs text-slate-500">
          Proyeksi akumulasi stok mingguan dengan simulasi Lead Time + 3 Bulan
          Buffer Pengiriman Gudang.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
          <thead>
            <tr className="font-semibold uppercase border-b bg-slate-100 text-slate-600 border-slate-200">
              <th className="sticky left-0 z-10 p-3 w-40 bg-slate-100">
                Material & Detail
              </th>
              <th className="p-3 text-right">Stok Awal</th>
              <th className="p-3 text-center">Est. Material Habis</th>
              <th className="p-3 font-bold text-center text-amber-900 bg-amber-50">
                Batas Tanggal Beli (MRP)
              </th>
              {weekKeys.map((wk) => (
                <th key={wk} className="p-3 font-mono text-center">
                  {wk}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projections.map((proj, idx) => {
              const isUrgent = proj.orderTriggerWeek === 'IMMEDIATE / OVERDUE';
              const isSafe = proj.shortageWeek.includes('Safe');

              return (
                <tr key={idx} className="transition-colors hover:bg-slate-50">
                  <td className="sticky left-0 z-10 p-3 bg-white shadow-md">
                    <div className="font-bold text-slate-800">{proj.name}</div>
                    <div className="font-semibold text-[10px] text-slate-600 max-w-xs truncate">
                      ({proj.color})
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">
                      {proj.materialId}
                    </div>
                    <div className="text-[9px] text-indigo-600 font-semibold uppercase">
                      {proj.supplier}
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-right text-slate-700">
                    {formatNumber(proj.initialStock)}
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
                      key={tIdx}
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
