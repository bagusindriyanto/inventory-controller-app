import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

export default function FileStatus({ title, excelData }) {
  return (
    <div
      className={cn('flex gap-3 items-center p-4 bg-card rounded-xl border', {
        'border-success/40': excelData,
        'border-border': !excelData,
      })}
    >
      <div
        className={cn('p-2 rounded-lg', {
          'bg-success/20 text-success': excelData,
          'bg-border text-muted-foreground': !excelData,
        })}
      >
        <Layers size={20} />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-400">{title}</div>
        <div
          className={cn('text-sm font-bold', {
            'text-success': excelData,
            'text-muted-foreground': !excelData,
          })}
        >
          {excelData ? `${excelData.length} Items Terunggah` : 'Belum Ada File'}
        </div>
      </div>
    </div>
  );
}
