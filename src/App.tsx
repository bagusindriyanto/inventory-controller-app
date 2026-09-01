import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import Navbar from './components/Navbar';
import EmptySelection from './components/selection/EmptySelection';
import EmptyProjections from './components/material/EmptyProjections';
import EmptyStyles from './components/style/EmptyStyles';
import { useSheet } from './hooks/useSheet';
import type { Material, Order, Selection, Stock } from './types/rawData';

export default function App() {
  const { data: selectionData } = useSheet<Selection>({
    spreadsheetId: '17fRpcH0Y_emWyXHxU7B9IHwyyUlDlCLFpubTE_rIa8A',
    sheetName: 'New Selection Data',
    range: 'A2:G',
  });

  const { data: orderData } = useSheet<Order>({
    spreadsheetId: '17fRpcH0Y_emWyXHxU7B9IHwyyUlDlCLFpubTE_rIa8A',
    sheetName: 'RAW DATA',
    range: 'G1:N',
  });

  const { data: forecastData } = useSheet({
    spreadsheetId: '17fRpcH0Y_emWyXHxU7B9IHwyyUlDlCLFpubTE_rIa8A',
    sheetName: 'Forecast Decathlon',
    range: 'A3:AN',
  });

  const { data: materialData } = useSheet<Material>({
    spreadsheetId: '1TINI8aq5NGmvvNAdRr1LbaE4ZmXzzdsjFCB4vlm-EkQ',
    sheetName: 'Database Material',
    range: 'A2:K',
  });

  const { data: stockData } = useSheet<Stock>({
    spreadsheetId: '1TINI8aq5NGmvvNAdRr1LbaE4ZmXzzdsjFCB4vlm-EkQ',
    sheetName: 'Stok Material (Synthetic)',
    range: 'B4:H',
  });

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
