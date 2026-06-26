// src/components/SheetConnector.jsx
import { useState } from 'react';
import { Link2, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { RefreshCw } from 'lucide-react';

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
    <div className="p-6 bg-white rounded-xl border shadow-xs border-slate-100">
      <h3 className="flex gap-2 items-center mb-4 text-lg font-bold text-slate-800">
        <Link2 className="text-[#007cbd]" size={20} /> Koneksi Terintegrasi
        (Google Sheets)
      </h3>

      <div className="mb-4">
        <label className="block mb-1 text-xs font-semibold text-slate-500">
          Google Spreadsheet ID
        </label>
        <input
          type="text"
          value={spreadsheetId}
          onChange={(e) => setSpreadsheetId(e.target.value)}
          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:border-[#007cbd]"
          placeholder="Masukkan ID Spreadsheet"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          Sistem akan otomatis mengambil sheet: <i>New Selection Data</i>,{' '}
          <i>RAW DATA</i>, & <i>Forecast Decathlon</i> sekaligus.
        </p>
      </div>

      <button
        onClick={handleFetchAllSheets}
        disabled={loading}
        className="w-full bg-[#007cbd] hover:bg-blue-700 text-white font-semibold py-2.5 px-4 text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
      >
        <RefreshCw className={loading && 'animate-spin'} size={14} />
        <span>{loading ? 'Mengunduh Data...' : 'Refresh Data'}</span>
      </button>

      {!!status && (
        <div
          className={`mt-3 p-2 ${error ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'}  text-xs font-medium rounded-md flex items-center gap-2`}
        >
          {error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}{' '}
          {status}
        </div>
      )}
    </div>
  );
}
