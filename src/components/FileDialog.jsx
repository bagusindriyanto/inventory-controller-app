import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Link2Icon } from 'lucide-react';
import { FileSpreadsheetIcon } from 'lucide-react';
import { XCircleIcon } from 'lucide-react';
import { CheckCircle2Icon } from 'lucide-react';
import { Spinner } from './ui/spinner';

export default function FileDialog({
  sheetData,
  materialData,
  stockData,
  onMaterialDataChange,
  onStockDataChange,
  loading,
  error,
  refetch,
}) {
  const dataLength = Object.keys(sheetData)?.length || 0;

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger
          render={<DialogTrigger render={<Button size="lg" />} />}
        >
          <FileUpIcon data-icon="inline-start" />
          Upload File
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <ol className="space-y-1">
            <li className="flex items-center justify-between gap-4">
              Koneksi ke Google Sheets
              {dataLength > 0 && !loading && (
                <CheckCircle2Icon className="size-4 text-green-300" />
              )}
              {error && !loading && (
                <XCircleIcon className="size-4 text-red-300" />
              )}
              {loading && <Spinner className="text-sky-300" />}
            </li>
            <li className="flex items-center justify-between gap-4">
              Database Material (BOM Update)
              {materialData ? (
                <CheckCircle2Icon className="size-4 text-green-300" />
              ) : (
                <XCircleIcon className="size-4 text-red-300" />
              )}
            </li>
            <li className="flex items-center justify-between gap-4">
              Stock Material
              {stockData ? (
                <CheckCircle2Icon className="size-4 text-green-300" />
              ) : (
                <XCircleIcon className="size-4 text-red-300" />
              )}
            </li>
          </ol>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-bold">Upload File</DialogTitle>
        </DialogHeader>
        <div className="no-scrollbar max-h-[50vh] overflow-y-auto px-3 py-1 space-y-8">
          <SheetConnector
            dataLength={dataLength}
            loading={loading}
            error={error}
            refetch={refetch}
          />
          <div className="grid grid-cols-2 gap-8">
            <FileUploader
              title="Database Material (BOM Update)"
              onUploadComplete={onMaterialDataChange}
            />
            <FileUploader
              title="Stock Material"
              onUploadComplete={onStockDataChange}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Batal</Button>} />
          <Button type="submit">Proses Data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
