import { PackageCheck } from 'lucide-react';

export default function SheetStatus({ sheetData }) {
  return (
    <div className="flex gap-3 items-center p-4 bg-white rounded-xl border border-slate-100">
      <div
        className={`p-2 rounded-lg ${Object.keys(sheetData).length > 0 ? 'text-blue-600 bg-blue-50' : 'bg-slate-100 text-slate-400'}`}
      >
        <PackageCheck size={20} />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-400">
          File 1, 2, 3 (Spreadsheet)
        </div>
        <div className="text-sm font-bold text-slate-700">
          {Object.keys(sheetData).length > 0
            ? 'Koneksi Terhubung'
            : 'Menunggu Sinkronisasi'}
        </div>
      </div>
    </div>
  );
}
