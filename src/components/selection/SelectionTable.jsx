// src/components/SelectionTable.jsx
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { formatNumber } from '@/utils/numberFormatter';

export default function SelectionTable({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="overflow-hidden mb-6 bg-white rounded-xl border shadow-xs border-slate-100">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <h3 className="text-base font-bold text-slate-800">
          Hasil Perhitungan Sisa Selection
        </h3>
        <p className="text-xs text-slate-500">
          Analisis deviasi antara target musiman (Selection) vs Pesanan Masuk
          (Order) + Forecast.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="font-semibold uppercase border-b bg-slate-100 text-slate-600 border-slate-200">
              <th className="p-3">Season</th>
              <th className="p-3">Model Code</th>
              <th className="p-3">Style</th>
              <th className="p-3 text-right">Sum of Selection</th>
              <th className="p-3 text-right">Qty Order</th>
              <th className="p-3 text-right">Total Forecast</th>
              <th className="p-3 text-right">Sisa Selection</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
