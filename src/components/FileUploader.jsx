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
      // XLSX.read bisa membaca file .xlsx maupun .csv lokal secara otomatis
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
    <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-100 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
          <FileSpreadsheet className="text-emerald-600" size={18} /> {title}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Upload file berformat .xlsx atau .csv langsung dari komputer.
        </p>
      </div>
      <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer block transition-colors bg-slate-50">
        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={handleFileChange}
          className="hidden"
        />
        <UploadCloud className="mx-auto text-slate-400 mb-2" size={28} />
        <span className="text-xs font-semibold text-slate-600 block">
          {fileName ? fileName : 'Pilih / Seret File Excel atau CSV'}
        </span>
      </label>
    </div>
  );
}
