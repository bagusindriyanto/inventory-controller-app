import { Layers } from 'lucide-react';

export default function FileStatus({ title, excelData }) {
  return (
    <div className="flex gap-3 items-center p-4 bg-white rounded-xl border border-slate-100">
      <div
        className={`p-2 rounded-lg ${excelData ? 'text-emerald-600 bg-emerald-50' : 'bg-slate-100 text-slate-400'}`}
      >
        <Layers size={20} />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-400">{title}</div>
        <div className="text-sm font-bold text-slate-700">
          {excelData ? `${excelData.length} Items Terunggah` : 'Belum Ada File'}
        </div>
      </div>
    </div>
  );
}
