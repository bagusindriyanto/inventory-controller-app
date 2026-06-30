import {
  Link2,
  RefreshCw,
  Loader2,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export default function SheetConnector({ sheetData, loading, error, refetch }) {
  const dataLength = Object.keys(sheetData)?.length || 0;

  return (
    <Card className="shadow-xs lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex gap-2 items-center text-sm font-bold">
          <Link2 className="text-primary" size={18} />
          Koneksi Google Sheets
        </CardTitle>
        <CardDescription className="text-xs">
          Sistem akan otomatis mengambil sheet: New Selection Data, RAW DATA, &
          Forecast Decathlon sekaligus.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center flex-1">
        <Button
          size="lg"
          onClick={refetch}
          disabled={loading}
          className="w-full"
        >
          <RefreshCw
            data-icon="inline-start"
            className={cn(loading && 'animate-spin')}
          />
          {loading ? 'Mengunduh Data...' : 'Refresh Data'}
        </Button>
      </CardContent>
      <CardFooter className="gap-3">
        <div
          className={cn('p-2 rounded-lg transition-colors duration-300', {
            'bg-primary/20 text-primary': loading,
            'bg-destructive/30 text-destructive': error && !loading,
            'bg-success/20 text-success': dataLength > 0 && !error && !loading,
            'bg-border text-muted-foreground':
              dataLength === 0 && !error && !loading,
          })}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : error ? (
            <AlertCircle size={16} />
          ) : (
            <PackageCheck size={16} />
          )}
        </div>
        <p
          className={cn('text-sm font-bold transition-colors duration-300', {
            'text-primary': loading,
            'text-destructive': error && !loading,
            'text-success': dataLength > 0 && !error && !loading,
            'text-muted-foreground': dataLength === 0 && !error && !loading,
          })}
        >
          {loading
            ? 'Menghubungkan...'
            : error
              ? 'Gagal Terkoneksi ke Google Sheets'
              : dataLength > 0
                ? 'Koneksi Terhubung'
                : 'Menunggu Sinkronisasi'}
        </p>
      </CardFooter>
    </Card>
  );
}
