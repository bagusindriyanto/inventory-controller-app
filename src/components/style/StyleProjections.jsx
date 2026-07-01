import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/numberFormatter';
import { transformOptimumReport } from '@/utils/solver';
import { PreviewCard } from '@base-ui/react';
import { useState, useMemo } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../ui/hover-card';

const remainingCard = PreviewCard.createHandle();
const materialCard = PreviewCard.createHandle();

export default function StyleProjections({ optimumReport, forecastData }) {
  const [openRemaining, setOpenRemaining] = useState(false);
  const [triggerRemainingId, setTriggerRemainingId] = useState(null);

  const [open, setOpen] = useState(false);
  const [triggerId, setTriggerId] = useState(null);

  const handleOpenChange = (isOpen, eventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  const handleOpenRemainingChange = (isOpen, eventDetails) => {
    setOpenRemaining(isOpen);
    setTriggerRemainingId(eventDetails.trigger?.id ?? null);
  };

  // A. Ekstrak daftar header minggu secara dinamis dari keys report
  const weeksHeader = useMemo(() => {
    return Object.keys(optimumReport).sort((a, b) => parseInt(a) - parseInt(b));
  }, [optimumReport]);

  // B. Transformasikan data report ke bentuk baris tabel (Horizontal Style)
  const tableRows = useMemo(() => {
    return transformOptimumReport(optimumReport, forecastData);
  }, [optimumReport, forecastData]);

  return (
    <>
      <div className="overflow-hidden mb-6 bg-white rounded-xl border shadow-xs border-slate-100">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex flex-col gap-3 justify-between sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Production Optimization Report
              </h3>
              <p className="text-xs text-slate-500">
                Alokasi kuantitas style teroptimal berdasarkan ketersediaan
                material. Arahkan mouse ke sel tabel untuk melihat informasi
                detail.
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
                {weeksHeader.map((week) => {
                  const remaining = optimumReport[week].remaining;
                  const payload = { week, remaining };

                  return (
                    <th
                      key={`th-${week}`}
                      scope="col"
                      className="p-3 text-center font-mono min-w-15"
                    >
                      <HoverCardTrigger
                        handle={remainingCard}
                        id={`week-${week}`}
                        payload={payload}
                      >
                        {week}
                      </HoverCardTrigger>
                    </th>
                  );
                })}
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
                    const materialsStock = cell?.materialsStock || [];
                    const payload = { week, style: row.style, materialsStock };

                    return (
                      <td
                        key={`td-${week}`}
                        className={cn('p-3 text-center font-mono bg-white', {
                          'bg-green-100': cell.status === 'SAFE',
                          'bg-yellow-100': cell.status === 'PARTIAL (SHORTAGE)',
                          'bg-red-100': cell.status === 'UNFEASIBLE (STOP)',
                        })}
                      >
                        {cell.status === 'EMPTY' ? (
                          <span className="text-gray-300">-</span>
                        ) : (
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <HoverCardTrigger
                              handle={materialCard}
                              id={`${row.codeStyle}-${row.style}-${week}`}
                              payload={payload}
                              render={
                                <div className="font-semibold text-[10px] text-slate-600" />
                              }
                            >
                              {formatNumber(cell.actual)}
                            </HoverCardTrigger>
                            <div className="text-slate-400 text-[8px]">
                              Forecast: {formatNumber(cell.forecast)}
                            </div>
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
      <HoverCard
        handle={remainingCard}
        open={openRemaining}
        onOpenChange={handleOpenRemainingChange}
        triggerId={triggerRemainingId}
      >
        {({ payload }) => (
          <HoverCardContent side="top" className="w-72">
            <h3 className="font-bold">Sisa Material</h3>
            <div className="flex justify-between pb-1.5 mb-2">
              <p className="text-xs text-muted-foreground">
                (W{payload?.week})
              </p>
            </div>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {payload?.remaining.map((mat) => (
                <div
                  key={mat.id}
                  className="text-[10px] pb-2 border-b border-slate-300 last:border-0 last:pb-0"
                >
                  {/* Top Row: Name and Remaining Stock */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold leading-tight line-clamp-2 max-w-[160px] uppercase">
                      {mat.name}
                    </div>
                    <div className="font-mono text-right">
                      <span
                        className={cn(
                          mat.qty <= 0 ? 'text-red-400' : 'text-emerald-400',
                        )}
                      >
                        {formatNumber(mat.qty, 2)}
                      </span>
                      <span className="font-bold"> {mat.unit}</span>
                    </div>
                  </div>

                  {/* Bottom Row: ID, Color, Supplier */}
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[8px] font-mono mt-1">
                    <span className="font-medium">{mat.id}</span>
                    <span>•</span>
                    <span>{mat.color}</span>
                    <span>•</span>
                    <span className="text-muted-foreground font-medium uppercase">
                      {mat.supplier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
      <HoverCard
        handle={materialCard}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        {({ payload }) => (
          <HoverCardContent side="top" className="w-72">
            <h3 className="font-bold">Material yang Digunakan</h3>
            <div className="flex justify-between pb-1.5 mb-2">
              <p className="text-xs text-muted-foreground truncate uppercase max-w-50">
                {payload?.style}
              </p>
              <p className="text-xs text-muted-foreground">
                (W{payload?.week})
              </p>
            </div>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {payload?.materialsStock.map((mat) => (
                <div
                  key={mat.id}
                  className="text-[10px] pb-2 border-b border-slate-300 last:border-0 last:pb-0"
                >
                  {/* Top Row: Name and Remaining Stock */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold leading-tight line-clamp-2 max-w-[120px] uppercase">
                      {mat.name}
                    </div>
                    <div className="font-mono text-right">
                      <span
                        className={
                          mat.actual < mat.needed
                            ? 'text-red-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }
                      >
                        {formatNumber(mat.actual, 2)}
                      </span>
                      <span>/</span>
                      <span>{formatNumber(mat.needed, 2)}</span>
                      <span className="font-bold"> {mat.unit}</span>
                    </div>
                  </div>

                  {/* Bottom Row: ID, Color, Supplier */}
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[8px] font-mono mt-1">
                    <span className="font-medium">{mat.id}</span>
                    <span>•</span>
                    <span>{mat.color}</span>
                    <span>•</span>
                    <span className="text-muted-foreground font-medium uppercase">
                      {mat.supplier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
    </>
  );
}
