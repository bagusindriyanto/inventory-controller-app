import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import Navbar from './components/Navbar';
import EmptySelection from './components/selection/EmptySelection';
import EmptyProjections from './components/material/EmptyProjections';
import EmptyStyles from './components/style/EmptyStyles';
import { useBusinessData, useWarehouseData } from './hooks/useMasterData';

export default function App() {
  const {
    selection: { data: selectionData },
    order: { data: orderData },
    forecast: { data: forecastData },
  } = useBusinessData();
  const {
    material: { data: materialData },
    stock: { data: stockData },
  } = useWarehouseData();

  console.log('selection data', selectionData);
  console.log('order data', orderData);
  console.log('forecast data', forecastData);
  console.log('material data', materialData);
  console.log('stock data', stockData);

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
