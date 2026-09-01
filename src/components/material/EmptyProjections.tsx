import { SearchX } from 'lucide-react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty';

export default function EmptyProjections() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader className="max-w-md">
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>Proyeksi Kebutuhan Material Tidak Tersedia</EmptyTitle>
        <EmptyDescription>
          Silakan lakukan sinkronisasi Spreadsheet dan unggah berkas File 4 & 5
          untuk memunculkan proyeksi kebutuhan material.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
