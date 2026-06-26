import { SearchX } from 'lucide-react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty';

export default function EmptySelection() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader className="max-w-md">
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>Proyeksi Sisa Selection Tidak Tersedia</EmptyTitle>
        <EmptyDescription>
          Silakan lakukan sinkronisasi Spreadsheet untuk memunculkan proyeksi
          sisa selection.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
