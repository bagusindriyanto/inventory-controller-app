import { useState, useMemo } from 'react';
import SheetConnector from './components/SheetConnector';
import FileUploader from './components/FileUploader';
import SelectionTable from './components/SelectionTable';
import MaterialProjections from './components/MaterialProjections';
import {
  calculateSelectionRemaining,
  calculateMaterialAvailability,
} from './utils/dataProcessor';
import { Layers, PackageCheck, BarChart3 } from 'lucide-react';

export default function App() {
  // Master State untuk Data Sumber
  const [sheetData, setSheetData] = useState(null); // berisi: selectionRaw, orderRaw, forecastRaw
  const [materialDb, setMaterialDb] = useState(null); // File 4
  const [stockData, setStockData] = useState(null); // File 5

  // Trigger kalkulasi menggunakan useMemo untuk optimasi performa render
  const selectionAnalysis = useMemo(() => {
    if (!sheetData) return [];
    return calculateSelectionRemaining(
      sheetData.selectionRaw,
      sheetData.orderRaw,
      sheetData.forecastRaw,
    );
  }, [sheetData]);

  const componentAnalysis = useMemo(() => {
    if (!sheetData || !materialDb || !stockData) return null;
    return calculateMaterialAvailability(
      sheetData.forecastRaw,
      materialDb,
      stockData,
    );
  }, [sheetData, materialDb, stockData]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header Panel */}
      <header className="p-4 text-white border-b shadow-md bg-slate-900 border-slate-800">
        <div className="flex justify-between items-center mx-auto max-w-7xl">
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-[#007cbd] rounded-lg">
              <Layers size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                MGM SPO - Material Monitoring
              </h1>
              <p className="text-xs text-slate-400">
                Material Tracing & Allocation by SPO
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 mx-auto space-y-6 w-full max-w-7xl md:p-6">
        {/* Kontrol Integrasi Data */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SheetConnector onDataLoaded={(data) => setSheetData(data)} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:col-span-2 md:grid-cols-2">
            <FileUploader
              title="Database Material (BOM Update)"
              onUploadComplete={(data) => setMaterialDb(data)}
            />
            <FileUploader
              title="Stock Material"
              onUploadComplete={(data) => setStockData(data)}
            />
          </div>
        </div>

        {/* Dashboard Status Indikator Kesiapan Data */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex gap-3 items-center p-4 bg-white rounded-xl border border-slate-100">
            <div
              className={`p-2 rounded-lg ${sheetData ? 'text-blue-600 bg-blue-50' : 'bg-slate-100 text-slate-400'}`}
            >
              <PackageCheck size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">
                File 1, 2, 3 (Spreadsheet)
              </div>
              <div className="text-sm font-bold text-slate-700">
                {sheetData ? 'Koneksi Terhubung' : 'Menunggu Sinkronisasi'}
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center p-4 bg-white rounded-xl border border-slate-100">
            <div
              className={`p-2 rounded-lg ${materialDb ? 'text-emerald-600 bg-emerald-50' : 'bg-slate-100 text-slate-400'}`}
            >
              <Layers size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">
                File 4 (Database Material)
              </div>
              <div className="text-sm font-bold text-slate-700">
                {materialDb
                  ? `${materialDb.length} Items Terunggah`
                  : 'Belum Ada File'}
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center p-4 bg-white rounded-xl border border-slate-100">
            <div
              className={`p-2 rounded-lg ${stockData ? 'text-purple-600 bg-purple-50' : 'bg-slate-100 text-slate-400'}`}
            >
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400">
                File 5 (Stock Material)
              </div>
              <div className="text-sm font-bold text-slate-700">
                {stockData
                  ? `${stockData.length} Items Terunggah`
                  : 'Belum Ada File'}
              </div>
            </div>
          </div>
        </div>

        {/* Output Analisis Terhitung */}
        {sheetData && <SelectionTable data={selectionAnalysis} />}
        {componentAnalysis ? (
          <MaterialProjections data={componentAnalysis} />
        ) : (
          <div className="p-12 text-sm font-medium text-center bg-white rounded-xl border border-slate-100 text-slate-400 shadow-xs">
            Silakan lakukan sinkronisasi Spreadsheet dan unggah berkas File 4 &
            5 untuk memunculkan proyeksi kebutuhan material.
          </div>
        )}
      </main>
    </div>
  );
}
