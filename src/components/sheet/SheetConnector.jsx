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
import { RefreshCwIcon } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../ui/alert';

export default function SheetConnector({ sheetData, loading, error, refetch }) {
  const dataLength = Object.keys(sheetData)?.length || 0;

  return (
    <Alert>
      <AlertTitle>
        <Link2 className="text-primary" size={18} /> Koneksi ke Google Sheets
      </AlertTitle>
      <AlertDescription>
        {loading
          ? 'Menghubungkan...'
          : error
            ? error
            : dataLength > 0
              ? 'Koneksi Terhubung'
              : 'Menunggu Sinkronisasi'}
      </AlertDescription>
      <AlertAction>
        <Button
          size="xs"
          variant="default"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCwIcon
            data-icon="inline-start"
            className={cn(loading && 'animate-spin')}
          />
          {loading ? 'Mengunduh Data...' : 'Refresh Data'}
        </Button>
      </AlertAction>
    </Alert>
  );
}
