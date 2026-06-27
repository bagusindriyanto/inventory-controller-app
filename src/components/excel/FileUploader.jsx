// src/components/FileUploader.jsx (Versi murni XLSX, tanpa Papaparse)
import { useState } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

export default function FileUploader({ title, onUploadComplete }) {
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      // XLSX.read bisa membaca file .xlsx lokal secara otomatis
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Konversi baris spreadsheet menjadi JSON objek
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      onUploadComplete(rawData);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="flex gap-2 items-center text-sm font-bold">
          <FileSpreadsheet className="text-emerald-600" size={18} /> {title}
        </CardTitle>
        <CardDescription className="text-xs">
          Pastikan file hanya memiliki sheet yang dibutuhkan dan memiliki format
          .xlsx
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <label className="flex flex-col justify-center items-center p-4 h-full text-center rounded-xl border-2 border-dashed transition-colors cursor-pointer border-slate-200 hover:border-emerald-500 bg-slate-50">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <UploadCloud className="mx-auto mb-2 text-slate-400" size={28} />
          <span className="block text-xs font-semibold text-slate-600">
            {fileName ? fileName : 'Pilih File Excel'}
          </span>
        </label>
      </CardContent>
    </Card>
  );
}
