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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Panel */}
      <header className="bg-slate-900 text-white p-4 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#007cbd] rounded-lg">
              <Layers size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Supply Chain MRP Dashboard
              </h1>
              <p className="text-xs text-slate-400">
                Inventory Control & Material Run-Out Projections
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-sm border border-slate-700">
            Role: Material Controller
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Kontrol Integrasi Data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SheetConnector onDataLoaded={(data) => setSheetData(data)} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploader
              title="4. Database Material (BOM Update)"
              onUploadComplete={(data) => setMaterialDb(data)}
            />
            <FileUploader
              title="5. Stock Material (Update June)"
              onUploadComplete={(data) => setStockData(data)}
            />
          </div>
        </div>

        {/* Dashboard Status Indikator Kesiapan Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${sheetData ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
            >
              <PackageCheck size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">
                File 1, 2, 3 (Spreadsheet)
              </div>
              <div className="text-sm font-bold text-slate-700">
                {sheetData ? 'Koneksi Terhubung' : 'Menunggu Sinkronisasi'}
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${materialDb ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
            >
              <Layers size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">
                File 4 (Database Material)
              </div>
              <div className="text-sm font-bold text-slate-700">
                {materialDb
                  ? `${materialDb.length} Items Terunggah`
                  : 'Belum Ada File'}
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${stockData ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-400'}`}
            >
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">
                File 5 (Stock Re-Update)
              </div>
              <div className="text-sm font-bold text-slate-700">
                {stockData
                  ? `${stockData.length} Batch Inventori`
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
          <div className="bg-white p-12 text-center rounded-xl border border-slate-100 text-slate-400 text-sm font-medium shadow-xs">
            Silakan lengkapi sinkronisasi Spreadsheet dan unggah berkas File 4 &
            5 untuk memunculkan proyeksi kebutuhan material.
          </div>
        )}
      </main>
    </div>
  );
}
