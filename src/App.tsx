import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import Navbar from './components/Navbar';
import SelectionTable from './components/selection/SelectionTable';
import EmptySelection from './components/selection/EmptySelection';
import EmptyProjections from './components/material/EmptyProjections';
import EmptyStyles from './components/style/EmptyStyles';
import { useBusinessSummaries } from './hooks/useBusinessSummaries';
import { useWarehouseData } from './hooks/useMasterData';
import { calculateSelectionRemaining } from './utils/dataProcessor';

export default function App() {
  const {
    selectionSummary,
    orderSummary,
    forecastSummary,
    forecastSeasonalSummary,
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
            <EmptyProjections />
          </TabsContent>
          <TabsContent value="style">
            <EmptyStyles />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
