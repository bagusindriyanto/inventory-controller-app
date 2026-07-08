import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import SheetConnector from './sheet/SheetConnector';
import { Separator } from './ui/separator';
import FileUploader from './excel/FileUploader';

export default function FileCard({
  sheetData,
  onMaterialDataChange,
  onStockDataChange,
  loading,
  error,
  refetch,
}) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Upload File</CardTitle>
        <CardDescription>Upload file anda di sini</CardDescription>
      </CardHeader>
      <CardContent>
        <SheetConnector
          sheetData={sheetData}
          loading={loading}
          error={error}
          refetch={refetch}
        />
        <Separator />
        <FileUploader
          title="Database Material (BOM Update)"
          onUploadComplete={onMaterialDataChange}
        />
        <Separator />
        <FileUploader
          title="Stock Material"
          onUploadComplete={onStockDataChange}
        />
      </CardContent>
    </Card>
  );
}
