import { useState, useMemo } from 'react';

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

import { ENVIRONTMENT } from './config/environtment';
import Navbar from './components/Navbar';
import FileDialog from './components/FileDialog';

export default function App() {
  const { sheets, loading, error, refetch } = useGoogleSheets(
    ENVIRONTMENT.SPREADSHEET_ID,
    ENVIRONTMENT.SHEET_CONFIGS,
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
      <main className="p-4 mx-auto w-full max-w-7xl md:p-6">
        {/* Kontrol Integrasi Data */}
        <Tabs defaultValue="selection">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="selection">Sisa Selection</TabsTrigger>
              <TabsTrigger value="material">Proyeksi Material</TabsTrigger>
              <TabsTrigger value="style">Proyeksi Style</TabsTrigger>
            </TabsList>
            <FileDialog
              sheetData={sheets}
              materialData={materialData}
              stockData={stockData}
              onMaterialDataChange={(data) => setMaterialData(data)}
              onStockDataChange={(data) => setStockData(data)}
              loading={loading}
              error={error}
              refetch={refetch}
            />
          </div>
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
