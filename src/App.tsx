import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import Navbar from './components/Navbar';
import SelectionTable from './components/selection/SelectionTable';
import EmptySelection from './components/selection/EmptySelection';
import EmptyProjections from './components/material/EmptyProjections';
import MaterialProjections from './components/material/MaterialProjections';
import EmptyStyles from './components/style/EmptyStyles';
import { useBusinessSummaries } from './hooks/useBusinessSummaries';
import { useWarehouseData } from './hooks/useMasterData';
import {
  calculateMaterialAvailability,
  calculateSelectionRemaining,
} from './utils/dataProcessor';
import { useSolver } from './hooks/useSolver';
import StyleProjections from './components/style/StyleProjections';

export default function App() {
  const {
    selectionSummary,
    orderSummary,
    forecastSeasonalSummary,
    forecastSummary,
  } = useBusinessSummaries();
  const { material, stock } = useWarehouseData();

  const selectionAnalysis = useMemo(
    () =>
      selectionSummary.length &&
      orderSummary.length &&
      forecastSeasonalSummary.length
        ? calculateSelectionRemaining(
            selectionSummary,
            orderSummary,
            forecastSeasonalSummary,
          )
        : [],
    [selectionSummary, orderSummary, forecastSeasonalSummary],
  );

  const materialAvailability = useMemo(
    () =>
      forecastSummary.length && material.data?.length && stock.data?.length
        ? calculateMaterialAvailability(
            forecastSummary,
            material.data,
            stock.data,
          )
        : null,
    [forecastSummary, material.data, stock.data],
  );

  // Solver runs in a Web Worker; TODO: wire result/loading/error into StyleProjections.
  const {
    result: optimumReport,
    loading: solverLoading,
    error: solverError,
  } = useSolver(forecastSummary, material.data, stock.data);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Panel */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 p-4 mx-auto space-y-6 w-full max-w-7xl md:p-6">
        {/* Kontrol Integrasi Data */}
        <Tabs defaultValue="selection">
          <TabsList>
            <TabsTrigger value="selection">Sisa Selection</TabsTrigger>
            <TabsTrigger value="material">Proyeksi Material</TabsTrigger>
            <TabsTrigger value="style">Proyeksi Style</TabsTrigger>
          </TabsList>
          <TabsContent value="selection">
            {selectionAnalysis.length > 0 ? (
              <SelectionTable data={selectionAnalysis} />
            ) : (
              <EmptySelection />
            )}
          </TabsContent>
          <TabsContent value="material">
            {materialAvailability &&
            materialAvailability.projections.length > 0 ? (
              <MaterialProjections data={materialAvailability} />
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
