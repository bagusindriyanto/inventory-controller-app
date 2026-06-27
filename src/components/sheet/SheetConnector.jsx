// src/components/SheetConnector.jsx
import { Link2 } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
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

export default function SheetConnector({ loading, refetch }) {
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
      <CardContent className="flex-1"></CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
}
