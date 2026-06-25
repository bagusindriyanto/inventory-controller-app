// src/components/SelectionTable.jsx
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function SelectionTable({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <h3 className="font-bold text-slate-800 text-base">
          Hasil Perhitungan Sisa Selection
        </h3>
        <p className="text-xs text-slate-500">
          Analisis deviasi antara target musiman (Selection) vs Pesanan Masuk
          (Order) + Forecast.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <th className="p-3">Season</th>
              <th className="p-3">Model Code</th>
              <th className="p-3 text-right">Sum of Selection</th>
              <th className="p-3 text-right">Qty Order</th>
              <th className="p-3 text-right">Total Forecast</th>
              <th className="p-3 text-right">Sisa Selection</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-medium text-slate-700">{row.season}</td>
                <td className="p-3 font-mono text-slate-600 bg-slate-50">
                  {row.modelCode}
                </td>
                <td className="p-3 text-right font-semibold">
                  {row.selectionQty.toLocaleString()}
                </td>
                <td className="p-3 text-right text-amber-600">
                  {row.orderQty.toLocaleString()}
                </td>
                <td className="p-3 text-right text-blue-600">
                  {row.forecastQty.toLocaleString()}
                </td>
                <td
                  className={`p-3 text-right font-bold ${row.remainingSelection < 0 ? 'text-red-600' : 'text-emerald-600'}`}
                >
                  {row.remainingSelection.toLocaleString()}
                </td>
                <td className="p-3 text-center">
                  {row.remainingSelection < 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-red-50 text-red-700 font-medium">
                      <AlertTriangle size={12} /> Over-Consumed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-emerald-50 text-emerald-700 font-medium">
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
