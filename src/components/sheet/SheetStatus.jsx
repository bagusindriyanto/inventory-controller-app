import { cn } from '@/lib/utils';
import { AlertCircle, PackageCheck, Loader2 } from 'lucide-react';

export default function SheetStatus({ sheetData, loading, error }) {
  return (
    <div
      className={cn('flex gap-3 items-center p-4 bg-card rounded-xl border transition-colors duration-300', {
        'border-primary/40': loading,
        'border-destructive/40': error && !loading,
        'border-success/40': Object.keys(sheetData).length > 0 && !error && !loading,
        'border-border': Object.keys(sheetData).length === 0 && !error && !loading,
      })}
    >
      <div
        className={cn('p-2 rounded-lg transition-colors duration-300', {
          'bg-primary/20 text-primary': loading,
          'bg-destructive/30 text-destructive': error && !loading,
          'bg-success/20 text-success':
            Object.keys(sheetData).length > 0 && !error && !loading,
          'bg-border text-muted-foreground':
            Object.keys(sheetData).length === 0 && !error && !loading,
        })}
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : error ? (
          <AlertCircle size={20} />
        ) : (
          <PackageCheck size={20} />
        )}
      </div>
      <div>
        <div className="text-xs font-semibold text-muted-foreground">
          File 1, 2, 3 (Spreadsheet)
        </div>
        <div
          className={cn('text-sm font-bold transition-colors duration-300', {
            'text-primary': loading,
            'text-destructive': error && !loading,
            'text-success': Object.keys(sheetData).length > 0 && !error && !loading,
            'text-muted-foreground':
              Object.keys(sheetData).length === 0 && !error && !loading,
          })}
        >
          {loading
            ? 'Menghubungkan...'
            : error
              ? 'Gagal Terkoneksi ke Google Sheets'
              : Object.keys(sheetData).length > 0
                ? 'Koneksi Terhubung'
                : 'Menunggu Sinkronisasi'}
        </div>
      </div>
    </div>
  );
}
