import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import Navbar from './components/Navbar';
import EmptySelection from './components/selection/EmptySelection';
import EmptyProjections from './components/material/EmptyProjections';
import EmptyStyles from './components/style/EmptyStyles';
import { useBusinessSummaries } from './hooks/useBusinessSummaries';
import { useWarehouseData } from './hooks/useMasterData';

export default function App() {
  const {
    selection,
    order,
    forecast,
    selectionSummary,
    orderSummary,
    forecastSummary,
    forecastSeasonalSummary,
  } = useBusinessSummaries();
  const { material, stock } = useWarehouseData();

  const selectionData = selection.data;
  const orderData = order.data;
  const forecastData = forecast.data;
  const materialData = material.data;
  const stockData = stock.data;

  console.log('selection data', selectionData);
  console.log('order data', orderData);
  console.log('forecast data', forecastData);
  console.log('material data', materialData);
  console.log('stock data', stockData);
  console.log('selection summary', selectionSummary);
  console.log('order summary', orderSummary);
  console.log('forecast summary (weekly)', forecastSummary);
  console.log('forecast summary (seasonal)', forecastSeasonalSummary);

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
            <EmptySelection />
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
