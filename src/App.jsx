import { useState, useMemo } from 'react';
import SheetConnector from './components/sheet/SheetConnector';
import FileUploader from './components/excel/FileUploader';
import SelectionTable from './components/selection/SelectionTable';
import MaterialProjections from './components/material/MaterialProjections';
import {
  calculateSelectionRemaining,
  calculateMaterialAvailability,
} from './utils/dataProcessor';
import { Layers } from 'lucide-react';
import SheetStatus from './components/sheet/SheetStatus';
import FileStatus from './components/excel/FileStatus';
import EmptyProjections from './components/material/EmptyProjections';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import EmptySelection from './components/selection/EmptySelection';
import { useGoogleSheets } from './hooks/useGoogleSheets';
import { ENVIRONTMENT } from './config/environtment';
import EmptyStyles from './components/style/EmptyStyles';
import StyleProjections from './components/style/StyleProjections';
import { useSolver } from './hooks/useSolver';

export default function App() {
  const { sheets, loading, error, refetch } = useGoogleSheets(
    ENVIRONTMENT.SPREADSHEET_ID,
    ENVIRONTMENT.SHEET_CONFIGS,
  );

  // Master State untuk Data Sumber
  const [materialDb, setMaterialDb] = useState(null); // File 4
  const [stockData, setStockData] = useState(null); // File 5

  // Trigger kalkulasi menggunakan useMemo untuk optimasi performa render
  const selectionAnalysis = useMemo(() => {
    if (Object.keys(sheets).length === 0) return [];
    return calculateSelectionRemaining(
      sheets['New Selection Data_0'].data,
      sheets['RAW DATA_1'].data,
      sheets['Forecast Decathlon_2'].data,
    );
  }, [sheets]);

  const componentAnalysis = useMemo(() => {
    if (Object.keys(sheets).length === 0 || !materialDb || !stockData)
      return null;
    return calculateMaterialAvailability(
      sheets['Forecast Decathlon_3'].data,
      materialDb,
      stockData,
    );
  }, [sheets, materialDb, stockData]);

  const {
    result: optimumReport,
    loading: solverLoading,
    error: solverError,
  } = useSolver(sheets['Forecast Decathlon_3']?.data, materialDb, stockData);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Panel */}
      <header className="p-4 text-white border-b shadow-md bg-slate-900 border-slate-800">
        <div className="flex justify-between items-center mx-auto max-w-7xl">
          <div className="flex gap-3 items-center">
            <div className="p-2 rounded-lg bg-primary">
              <Layers size={22} className="text-primary-foreground" />
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
          <SheetConnector loading={loading} refetch={refetch} />
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
          <SheetStatus sheetData={sheets} loading={loading} error={error} />
          <FileStatus
            title={'File 4 (Database Material)'}
            excelData={materialDb}
          />
          <FileStatus title={'File 5 (Stock Material)'} excelData={stockData} />
        </div>

        <Tabs defaultValue="selection">
          <TabsList>
            <TabsTrigger value="selection">Sisa Selection</TabsTrigger>
            <TabsTrigger value="material">Proyeksi Material</TabsTrigger>
            <TabsTrigger value="style">Proyeksi Style</TabsTrigger>
          </TabsList>
          <TabsContent value="selection">
            {selectionAnalysis && selectionAnalysis.length > 0 ? (
              <SelectionTable data={selectionAnalysis} />
            ) : (
              <EmptySelection />
            )}
          </TabsContent>
          <TabsContent value="material">
            {componentAnalysis ? (
              <MaterialProjections data={componentAnalysis} />
            ) : (
              <EmptyProjections />
            )}
          </TabsContent>
          <TabsContent value="style">
            {solverLoading ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-100">
                {/* A premium looking loader spinner */}
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm text-slate-500 font-medium">
                  Running Linear Solver Simulation...
                </p>
              </div>
            ) : solverError ? (
              <div className="p-5 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                Error running solver: {solverError}
              </div>
            ) : optimumReport ? (
              <StyleProjections
                optimumReport={optimumReport}
                forecastData={sheets['Forecast Decathlon_3'].data}
              />
            ) : (
              <EmptyStyles />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
