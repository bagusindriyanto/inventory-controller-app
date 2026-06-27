import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { PackageCheck } from 'lucide-react';

export default function SheetStatus({ sheetData, error }) {
  return (
    <div
      className={cn('flex gap-3 items-center p-4 bg-card rounded-xl border', {
        'border-destructive/40': error,
        'border-success/40': Object.keys(sheetData).length > 0 && !error,
        'border-border': Object.keys(sheetData).length === 0 && !error,
      })}
    >
      <div
        className={cn('p-2 rounded-lg', {
          'bg-destructive/30 text-destructive': error,
          'bg-success/20 text-success':
            Object.keys(sheetData).length > 0 && !error,
          'bg-border text-muted-foreground':
            Object.keys(sheetData).length === 0 && !error,
        })}
      >
        {error ? <AlertCircle size={20} /> : <PackageCheck size={20} />}
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground">
          File 1, 2, 3 (Spreadsheet)
        </div>
        <div
          className={cn('text-sm font-bold', {
            'text-destructive': error,
            'text-success': Object.keys(sheetData).length > 0 && !error,
            'text-muted-foreground':
              Object.keys(sheetData).length === 0 && !error,
          })}
        >
          {error
            ? 'Gagal Terkoneksi ke Google Sheets'
            : Object.keys(sheetData).length > 0
              ? 'Koneksi Terhubung'
              : 'Menunggu Sinkronisasi'}
        </div>
      </div>
    </div>
  );
}
