import { useState, useMemo } from 'react';

import SheetConnector from './components/sheet/SheetConnector';
import FileUploader from './components/excel/FileUploader';

import SelectionTable from './components/selection/SelectionTable';
import EmptySelection from './components/selection/EmptySelection';

import MaterialProjections from './components/material/MaterialProjections';
import EmptyProjections from './components/material/EmptyProjections';

import StyleProjections from './components/style/StyleProjections';
import EmptyStyles from './components/style/EmptyStyles';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

import {
  calculateSelectionRemaining,
  calculateMaterialAvailability,
} from './utils/dataProcessor';

import { useGoogleSheets } from './hooks/useGoogleSheets';
import { useSolver } from './hooks/useSolver';

import { ENVIRONMENT } from './config/environment';
import Navbar from './components/Navbar';

export default function App() {
  const { sheets, loading, error, refetch } = useGoogleSheets(
    ENVIRONMENT.SPREADSHEET_ID,
    ENVIRONMENT.SHEET_CONFIGS,
  );

  // Master State untuk Data Sumber
  const [materialData, setMaterialData] = useState(null); // File 4
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
    if (Object.keys(sheets).length === 0 || !materialData || !stockData)
      return null;
    return calculateMaterialAvailability(
      sheets['Forecast Decathlon_3'].data,
      materialData,
      stockData,
    );
  }, [sheets, materialData, stockData]);

  const {
    result: optimumReport,
    loading: solverLoading,
    error: solverError,
  } = useSolver(sheets['Forecast Decathlon_3']?.data, materialData, stockData);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Panel */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 p-4 mx-auto space-y-6 w-full max-w-7xl md:p-6">
        {/* Kontrol Integrasi Data */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SheetConnector
            sheetData={sheets}
            loading={loading}
            error={error}
            refetch={refetch}
          />
          <div className="grid grid-cols-1 gap-6 lg:col-span-2 md:grid-cols-2">
            <FileUploader
              title="Database Material (BOM Update)"
              fileData={materialData}
              onUploadComplete={(data) => setMaterialData(data)}
            />
            <FileUploader
              title="Stock Material"
              fileData={stockData}
              onUploadComplete={(data) => setStockData(data)}
            />
          </div>
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
                  Menghitung Qty Style Teroptimal...
                </p>
              </div>
            ) : solverError ? (
              <div className="p-5 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                Error running solver: {solverError}
              </div>
            ) : optimumReport ? (
              <StyleProjections optimumReport={optimumReport} />
            ) : (
              <EmptyStyles />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
