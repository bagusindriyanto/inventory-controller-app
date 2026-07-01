import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/numberFormatter';
import { transformOptimumReport } from '@/utils/solver';
import { useMemo } from 'react';

export default function StyleProjections({ optimumReport, forecastData }) {
  // A. Ekstrak daftar header minggu secara dinamis dari keys report
  const weeksHeader = useMemo(() => {
    return Object.keys(optimumReport).sort((a, b) => parseInt(a) - parseInt(b));
  }, [optimumReport]);

  // B. Transformasikan data report ke bentuk baris tabel (Horizontal Style)
  const tableRows = useMemo(() => {
    return transformOptimumReport(optimumReport, forecastData);
  }, [optimumReport, forecastData]);

  // C. Helper fungsi untuk memberikan warna visual otomatis pada status produksi
  const getStatusClass = (status) => {
    switch (status) {
      case 'SAFE':
        return 'bg-green-100';
      case 'PARTIAL (SHORTAGE)':
        return 'bg-yellow-100';
      case 'UNFEASIBLE (STOP)':
        return 'bg-red-100';
      default:
        return 'bg-white';
    }
  };

  return (
    <div className="overflow-hidden mb-6 bg-white rounded-xl border shadow-xs border-slate-100">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <div className="flex flex-col gap-3 justify-between sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Production Optimization Report
            </h3>
            <p className="text-xs text-slate-500">
              Alokasi kuantitas style teroptimal berdasarkan ketersediaan
              material
            </p>
          </div>
          {/* Search Input */}
          <div className="relative w-full sm:w-64"></div>
        </div>
      </div>

      {/* LEGENDA STATUS DI BAGIAN ATAS TABEL */}
      <div className="p-4 flex gap-4 border-b border-slate-200 text-xs text-gray-600 justify-center bg-slate-100">
        <span>🟢 Aman (100% Terpenuhi)</span>
        <span>🟡 Parsial (Kurang Material)</span>
        <span>🔴 Kritis (Material Kosong)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          {/* HEADER TABEL */}
          <thead>
            <tr className="font-semibold uppercase border-b bg-slate-100 text-slate-600 border-slate-200">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-slate-100 p-3 hover:bg-slate-200 w-16"
              >
                Model Code
              </th>
              <th
                scope="col"
                className="sticky left-16 z-10 bg-slate-100 p-3 hover:bg-slate-200 min-w-50"
              >
                Style
              </th>
              {weeksHeader.map((week) => (
                <th
                  key={`th-${week}`}
                  scope="col"
                  className="p-3 text-center font-mono min-w-15"
                >
                  {week}
                </th>
              ))}
            </tr>
          </thead>

          {/* ISI ISI TABEL (BARIS) */}
          <tbody className="divide-y divide-slate-100">
            {tableRows.map((row) => (
              <tr
                key={`${row.codeStyle}-${row.style}`}
                className="hover:bg-slate-50 transition-colors"
              >
                {/* Kolom Nama Style (Sticky di kiri agar jika digeser tidak hilang) */}
                <td className="sticky left-0 z-10 p-3 font-mono font-medium bg-slate-50 shadow-md text-slate-600 w-16">
                  {row.codeStyle}
                </td>
                <td className="sticky left-16 z-10 p-3 font-medium uppercase bg-slate-50 text-slate-700">
                  {row.style}
                </td>

                {/* Looping Kolom Minggu Berjalan */}
                {weeksHeader.map((week) => {
                  const cell = row[week];
                  return (
                    <td
                      key={`td-${week}`}
                      className={cn(
                        'p-3 text-center font-mono',
                        getStatusClass(cell.status),
                      )}
                    >
                      {cell.status === 'EMPTY' ? (
                        <span className="text-gray-300">-</span>
                      ) : (
                        <div className="relative group flex flex-col gap-1 items-center justify-center cursor-help">
                          <div className="font-semibold text-[10px] text-slate-600">
                            {formatNumber(cell.actual)}
                          </div>
                          <div className="text-slate-400 text-[8px]">
                            Forecast: {formatNumber(cell.forecast)}
                          </div>

                          {/* Hover Tooltip: Sisa Material */}
                          {cell.materialsStock?.length > 0 && (
                            <div className="absolute bottom-full left-1/2 z-30 mb-2 w-72 -translate-x-1/2 scale-0 rounded-lg bg-slate-950 p-3 text-left text-[10px] text-white shadow-2xl border border-slate-800 transition-all duration-100 group-hover:scale-100 origin-bottom">
                              <div className="font-bold border-b border-slate-800 pb-1.5 mb-2 text-slate-200 flex justify-between">
                                <span>Kebutuhan Material (W{week}):</span>
                              </div>
                              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                {cell.materialsStock.map((mat) => (
                                  <div
                                    key={mat.id}
                                    className="pb-2 border-b border-slate-900 last:border-0 last:pb-0"
                                  >
                                    {/* Top Row: Name and Remaining Stock */}
                                    <div className="flex justify-between items-start gap-2">
                                      <div
                                        className="font-semibold text-slate-200 leading-tight line-clamp-2 max-w-[120px]"
                                        title={mat.name}
                                      >
                                        {mat.name}
                                      </div>
                                      <div>
                                        <span
                                          className={
                                            mat.actual < mat.needed
                                              ? 'text-red-400 font-bold font-mono text-right'
                                              : 'text-emerald-400 font-semibold font-mono text-right'
                                          }
                                        >
                                          {formatNumber(mat.actual, 2)}
                                        </span>
                                        <span>
                                          /{formatNumber(mat.needed, 2)}{' '}
                                          {mat.unit}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Bottom Row: ID, Color, Supplier */}
                                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[8px] text-slate-400 font-mono mt-1">
                                      <span className="text-slate-500">
                                        {mat.id}
                                      </span>
                                      <span>•</span>
                                      <span>Color: {mat.color}</span>
                                      <span>•</span>
                                      <span className="text-indigo-300 font-medium uppercase">
                                        {mat.supplier}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
