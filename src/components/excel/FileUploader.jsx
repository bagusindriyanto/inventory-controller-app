// src/components/FileUploader.jsx (Versi murni XLSX, tanpa Papaparse)
import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Field, FieldLabel } from '../ui/field';
import { UploadCloudIcon } from 'lucide-react';
import { FileSpreadsheetIcon } from 'lucide-react';

export default function FileUploader({ title, onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (file) => {
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const arrayBuffer = evt.target.result;
      const wb = XLSX.read(arrayBuffer, { type: 'array' });

      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      setSelectedSheet(wb.SheetNames[0]);
      loadSheetData(wb, wb.SheetNames[0]);
    };

    reader.readAsArrayBuffer(file);
  };

  const loadSheetData = (wb, sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' });
    onUploadComplete(rawData);
  };

  const handleSheetChange = (value) => {
    setSelectedSheet(value);
    if (workbook) {
      loadSheetData(workbook, value);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const sheetItems = sheetNames.map((name) => ({
    label: name,
    value: name,
  }));

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <h3 className="flex gap-2 items-center text-sm font-semibold">
          <FileSpreadsheetIcon className="text-emerald-600" size={18} /> {title}
        </h3>
        <p className="text-xs text-muted-foreground">
          Pastikan file memiliki format .xlsx
        </p>
      </div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col justify-center items-center p-4 min-h-25 text-center rounded-xl border-2 border-dashed transition-all cursor-pointer',
          {
            'scale-[1.02] border-emerald-500 bg-emerald-500/10': isDragging,
            'border-muted hover:border-emerald-500 hover:bg-muted/50':
              !isDragging,
          },
        )}
      >
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) =>
            e.target.files && handleFileChange(e.target.files[0])
          }
          className="hidden"
        />
        <UploadCloudIcon
          className={cn(
            'mx-auto mb-2',
            isDragging ? 'text-emerald-600' : 'text-muted-foreground',
          )}
          size={28}
        />
        {fileName ? (
          <p
            className={cn(
              'text-xs font-medium',
              isDragging ? 'text-emerald-600' : 'text-muted-foreground',
            )}
          >
            {fileName}
          </p>
        ) : (
          <div className="space-y-0.5 text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Drag & Drop File Di Sini
            </p>
            <p className="text-xs text-muted-foreground font-light">
              atau klik untuk browse
            </p>
          </div>
        )}
      </label>
      <Field orientation="horizontal">
        <FieldLabel>Pilih sheet:</FieldLabel>
        <Select
          items={sheetItems}
          value={selectedSheet}
          onValueChange={handleSheetChange}
          disabled={!workbook}
        >
          <SelectTrigger className="w-full max-w-36">
            <SelectValue placeholder="Nama sheet" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              {sheetItems.map((item) => (
                <SelectItem
                  className="focus:bg-emerald-600"
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
