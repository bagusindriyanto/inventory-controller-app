// src/components/SheetConnector.jsx
import { useState } from 'react';
import { Link2, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Field, FieldLabel } from '../ui/field';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export default function SheetConnector({ onDataLoaded }) {
  // Cukup 1 URL utama (ID Spreadsheet yang sama untuk File 1, 2, dan 3)
  const [spreadsheetId, setSpreadsheetId] = useState(
    '17fRpcH0Y_emWyXHxU7B9IHwyyUlDlCLFpubTE_rIa8A',
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);

  const handleFetchAllSheets = async () => {
    setLoading(true);
    setStatus('');
    setError(false);

    try {
      // URL untuk mengekspor seluruh dokumen sebagai XLSX
      const downloadUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;

      const response = await fetch(downloadUrl);
      if (!response.ok)
        throw new Error(
          'Gagal mengunduh spreadsheet. Periksa kembali hak akses.',
        );

      const buffer = await response.arrayBuffer();

      // Membaca workbook menggunakan SheetJS (xlsx)
      const workbook = XLSX.read(buffer, { type: 'array' });

      // Mengonversi masing-masing sheet berdasarkan nama sheet-nya
      const sheetNames = workbook.SheetNames;

      // Cari sheet yang sesuai dengan kriteria Anda
      const selectionSheetName = sheetNames.find((n) =>
        n.toLowerCase().includes('selection'),
      );
      const orderSheetName = sheetNames.find((n) =>
        n.toLowerCase().includes('raw data'),
      );
      const forecastSheetName = sheetNames.find((n) =>
        n.toLowerCase().includes('forecast'),
      );

      if (!selectionSheetName || !orderSheetName || !forecastSheetName) {
        throw new Error(
          'Nama sheet tidak sesuai. Pastikan terdapat sheet "New Selection Data", "RAW DATA", dan "Forecast Decathlon".',
        );
      }

      // Konversi sheet ke bentuk JSON Array
      const selectionRaw = XLSX.utils.sheet_to_json(
        workbook.Sheets[selectionSheetName],
        { range: 1, defval: '' },
      );
      const orderRaw = XLSX.utils.sheet_to_json(
        workbook.Sheets[orderSheetName],
        { defval: '' },
      );
      const forecastRaw = XLSX.utils.sheet_to_json(
        workbook.Sheets[forecastSheetName],
        { range: 2, defval: '' },
      );

      // Kirim balik ke App.jsx
      onDataLoaded({ selectionRaw, orderRaw, forecastRaw });
      setStatus('Data berhasil diambil');
    } catch (err) {
      console.error(err);
      setStatus(err.message || 'Terjadi kesalahan saat mengunduh spreadsheet.');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xs">
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
      <CardContent>
        <Field>
          <FieldLabel className="text-xs" htmlFor="spreadsheet-id">
            Google Spreadsheet ID
          </FieldLabel>
          <Input
            id="spreadsheet-id"
            type="text"
            className="md:text-xs"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            placeholder="Masukkan ID Spreadsheet"
          />
        </Field>
        {!!status && (
          <div
            className={`mt-3 p-2 ${error ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'}  text-xs font-medium rounded-md flex items-center gap-2`}
          >
            {error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}{' '}
            {status}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          size="lg"
          onClick={handleFetchAllSheets}
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
