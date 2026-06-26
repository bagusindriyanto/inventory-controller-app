// src/components/FileUploader.jsx (Versi murni XLSX, tanpa Papaparse)
import { useState } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

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
    <div className="flex flex-col justify-between p-6 bg-white rounded-xl border shadow-xs border-slate-100">
      <div>
        <h3 className="flex gap-2 items-center mb-2 text-sm font-bold text-slate-700">
          <FileSpreadsheet className="text-emerald-600" size={18} /> {title}
        </h3>
        <p className="mb-4 text-xs text-slate-400">
          Pastikan file hanya memiliki Sheet yang dibutuhkan dan memiliki format
          .xlsx
        </p>
      </div>
      <label className="block p-4 text-center rounded-xl border-2 border-dashed transition-colors cursor-pointer border-slate-200 hover:border-emerald-500 bg-slate-50">
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="hidden"
        />
        <UploadCloud className="mx-auto mb-2 text-slate-400" size={28} />
        <span className="block text-xs font-semibold text-slate-600">
          {fileName ? fileName : 'Pilih / Seret File Excel'}
        </span>
      </label>
    </div>
  );
}
