import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import SheetConnector from './sheet/SheetConnector';
import { Separator } from './ui/separator';
import FileUploader from './excel/FileUploader';
import { FileUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FileDialog({
  sheetData,
  onMaterialDataChange,
  onStockDataChange,
  loading,
  error,
  refetch,
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button size="lg" />}>
        <FileUpIcon data-icon="inline-start" />
        Upload File
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>Upload file anda di sini.</DialogDescription>
        </DialogHeader>
        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto p-4 grid grid-cols-3 gap-6">
          <SheetConnector
            sheetData={sheetData}
            loading={loading}
            error={error}
            refetch={refetch}
          />
          <FileUploader
            title="Database Material (BOM Update)"
            onUploadComplete={onMaterialDataChange}
          />
          <FileUploader
            title="Stock Material"
            onUploadComplete={onStockDataChange}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button type="submit">Proses Data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
