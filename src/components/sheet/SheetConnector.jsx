import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2Icon, AlertCircleIcon, Link2Icon } from 'lucide-react';
import { Alert, AlertAction, AlertTitle } from '../ui/alert';
import { Spinner } from '../ui/spinner';

export default function SheetConnector({
  dataLength,
  loading,
  error,
  refetch,
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="flex gap-2 items-center text-sm font-semibold">
          <Link2Icon className="text-primary" size={18} /> Koneksi ke Google
          Sheets
        </h3>
        <p className="text-xs text-muted-foreground">
          Sistem akan otomatis mengambil sheet: New Selection Data, RAW DATA, &
          Forecast Decathlon sekaligus.
        </p>
      </div>
      <Alert
        className={cn('-mx-2.5 transition-colors', {
          'bg-red-50 border-red-200 text-red-900': error,
          'bg-green-50 border-green-200 text-green-900': dataLength > 0,
          'bg-sky-50 border-sky-200 text-sky-900': loading,
        })}
      >
        {error && !loading && <AlertCircleIcon />}
        {dataLength > 0 && !loading && <CheckCircle2Icon />}
        {loading && <Spinner />}
        <AlertTitle>
          {loading
            ? 'Menghubungkan...'
            : error
              ? error
              : dataLength > 0
                ? 'Koneksi Terhubung'
                : 'Menunggu Sinkronisasi'}
        </AlertTitle>
        <AlertAction>
          <Button
            size="xs"
            variant="outline"
            onClick={refetch}
            disabled={loading}
          >
            {loading ? 'Mengunduh Data...' : 'Refresh Data'}
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}
