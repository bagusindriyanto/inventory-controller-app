import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/numberFormatter';
import { PreviewCard } from '@base-ui/react';
import { useState, useMemo } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../ui/hover-card';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

const remainingCard = PreviewCard.createHandle();
const materialCard = PreviewCard.createHandle();

export default function StyleProjections({ optimumReport }) {
  const [openRemaining, setOpenRemaining] = useState(false);
  const [triggerRemainingId, setTriggerRemainingId] = useState(null);

  const [open, setOpen] = useState(false);
  const [triggerId, setTriggerId] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const handleOpenChange = (isOpen, eventDetails) => {
    setOpen(isOpen);
    setTriggerId(eventDetails.trigger?.id ?? null);
  };

  const handleOpenRemainingChange = (isOpen, eventDetails) => {
    setOpenRemaining(isOpen);
    setTriggerRemainingId(eventDetails.trigger?.id ?? null);
  };

  // A. Ekstrak daftar header minggu dan baris tabel langsung dari data pre-transformed
  const weeksHeader = optimumReport.weeks;
  const tableRows = optimumReport.rows;

  // Columns definition for TanStack Table
  const columns = useMemo(() => {
    return [
      {
        accessorKey: 'modelCode',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            // className="-ml-2 hover:bg-slate-200 text-xs font-semibold uppercase text-slate-600 w-full justify-start"
          >
            Model Code
            <ChevronsUpDown data-icon="inline-end" />
          </Button>
        ),
        cell: ({ row }) => row.getValue('modelCode'),
      },
      {
        accessorKey: 'style',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            // className="-ml-2 hover:bg-slate-200 text-xs font-semibold uppercase text-slate-600 w-full justify-start"
          >
            Style
            <ChevronsUpDown data-icon="inline-end" />
          </Button>
        ),
        cell: ({ row }) => row.getValue('style'),
      },
      ...weeksHeader.map((week) => ({
        id: week,
        accessorFn: (row) => {
          const val = row[week]?.actual;
          return typeof val === 'number' ? val : -1;
        },
        header: ({ column }) => {
          const remaining = optimumReport.remaining[week] || [];
          const payload = { week, remaining };
          return (
            <HoverCardTrigger
              handle={remainingCard}
              id={`week-${week}`}
              payload={payload}
            >
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === 'asc')
                }
                // className="p-1 hover:bg-slate-200 text-xs font-semibold font-mono text-slate-600 inline-flex items-center mx-auto"
              >
                {week}
                <ChevronsUpDown data-icon="inline-end" />
              </Button>
            </HoverCardTrigger>
          );
        },
        cell: ({ row }) => {
          const cellData = row.original[week];
          if (!cellData || cellData.status === 'EMPTY') {
            return <span className="text-gray-300">-</span>;
          }

          const materialsStock = cellData.materialsStock || [];
          const payload = { week, style: row.original.style, materialsStock };

          return (
            <div className="flex flex-col gap-1 items-center justify-center">
              <HoverCardTrigger
                handle={materialCard}
                id={`${row.original.modelCode}-${row.original.style}-${week}`}
                payload={payload}
                render={
                  <div className="font-semibold text-[10px] text-slate-600 cursor-pointer hover:underline" />
                }
              >
                {formatNumber(cellData.actual)}
              </HoverCardTrigger>
              <div className="text-slate-400 text-[8px]">
                Forecast: {formatNumber(cellData.forecast)}
              </div>
            </div>
          );
        },
      })),
    ];
  }, [weeksHeader, optimumReport]);

  const table = useReactTable({
    data: tableRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  return (
    <>
      <div className="overflow-hidden mb-6 bg-white rounded-xl border shadow-xs border-slate-100">
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex flex-col gap-3 justify-between sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Production Optimization Report
              </h3>
              <p className="text-xs text-slate-500">
                Alokasi kuantitas style teroptimal berdasarkan ketersediaan
                material. Arahkan mouse ke sel tabel untuk melihat informasi
                detail.
              </p>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Filter styles..."
                value={table.getColumn('style')?.getFilterValue() ?? ''}
                onChange={(event) =>
                  table.getColumn('style')?.setFilterValue(event.target.value)
                }
                className="w-full bg-white"
              />
            </div>
          </div>
        </div>

        {/* LEGENDA STATUS DI BAGIAN ATAS TABEL */}
        <div className="p-4 flex gap-4 border-b border-slate-200 text-xs text-gray-600 justify-center bg-slate-100">
          <span>🟢 Aman (100% Terpenuhi)</span>
          <span>🟡 Parsial (Kurang Material)</span>
          <span>🔴 Kritis (Material Kosong)</span>
        </div>

        <div className="overflow-x-auto">
          <Table className="text-xs">
            {/* HEADER TABEL */}
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            {/* ISI ISI TABEL (BARIS) */}
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    // className="hover:bg-slate-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isModelCode = cell.column.id === 'modelCode';
                      const isStyle = cell.column.id === 'style';

                      if (isModelCode) {
                        return (
                          <TableCell
                            key={cell.id}
                            className="sticky left-0 z-10 p-3 bg-slate-50 shadow-md text-slate-600 w-16 font-mono font-medium border-r border-slate-100"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      }

                      if (isStyle) {
                        return (
                          <TableCell
                            key={cell.id}
                            className="sticky left-16 z-10 p-3 bg-slate-50 shadow-md text-slate-700 font-medium uppercase min-w-50 border-r border-slate-100"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      }

                      // Week columns
                      const week = cell.column.id;
                      const cellData = row.original[week];
                      const status = cellData?.status;

                      return (
                        <TableCell
                          key={cell.id}
                          className={cn('p-3 text-center font-mono bg-white', {
                            'bg-green-100': status === 'SAFE',
                            'bg-yellow-100': status === 'PARTIAL (SHORTAGE)',
                            'bg-red-100': status === 'UNFEASIBLE (STOP)',
                          })}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-slate-500 font-medium"
                  >
                    No styles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50 text-xs">
          <div className="text-slate-500 font-medium">
            Menampilkan{' '}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{' '}
            sampai{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length,
            )}{' '}
            dari {table.getFilteredRowModel().rows.length} styles
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft data-icon="inline-start" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Selanjutnya
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>

      <HoverCard
        handle={remainingCard}
        open={openRemaining}
        onOpenChange={handleOpenRemainingChange}
        triggerId={triggerRemainingId}
      >
        {({ payload }) => (
          <HoverCardContent side="top" className="w-72">
            <h3 className="font-bold">Sisa Material</h3>
            <div className="flex justify-between pb-1.5 mb-2">
              <p className="text-xs text-muted-foreground">
                (W{payload?.week})
              </p>
            </div>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {payload?.remaining.map((mat) => (
                <div
                  key={mat.id}
                  className="text-[10px] pb-2 border-b border-slate-300 last:border-0 last:pb-0"
                >
                  {/* Top Row: Name and Remaining Stock */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold leading-tight line-clamp-2 max-w-[160px] uppercase">
                      {mat.name}
                    </div>
                    <div className="font-mono text-right">
                      <span
                        className={cn(
                          mat.qty <= 0 ? 'text-red-400' : 'text-emerald-400',
                        )}
                      >
                        {formatNumber(mat.qty, 2)}
                      </span>
                      <span className="font-bold"> {mat.unit}</span>
                    </div>
                  </div>

                  {/* Bottom Row: ID, Color, Supplier */}
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[8px] font-mono mt-1">
                    <span className="font-medium">{mat.id}</span>
                    <span>•</span>
                    <span>{mat.color}</span>
                    <span>•</span>
                    <span className="text-muted-foreground font-medium uppercase">
                      {mat.supplier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </HoverCardContent>
        )}
      </HoverCard>

      <HoverCard
        handle={materialCard}
        open={open}
        onOpenChange={handleOpenChange}
        triggerId={triggerId}
      >
        {({ payload }) => (
          <HoverCardContent side="top" className="w-72">
            <h3 className="font-bold">Material yang Digunakan</h3>
            <div className="flex justify-between pb-1.5 mb-2">
              <p className="text-xs text-muted-foreground truncate uppercase max-w-50">
                {payload?.style}
              </p>
              <p className="text-xs text-muted-foreground">
                (W{payload?.week})
              </p>
            </div>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {payload?.materialsStock.map((mat) => (
                <div
                  key={mat.id}
                  className="text-[10px] pb-2 border-b border-slate-300 last:border-0 last:pb-0"
                >
                  {/* Top Row: Name and Remaining Stock */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold leading-tight line-clamp-2 max-w-[120px] uppercase">
                      {mat.name}
                    </div>
                    <div className="font-mono text-right">
                      <span
                        className={
                          mat.actual < mat.needed
                            ? 'text-red-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }
                      >
                        {formatNumber(mat.actual, 2)}
                      </span>
                      <span>/</span>
                      <span>{formatNumber(mat.needed, 2)}</span>
                      <span className="font-bold"> {mat.unit}</span>
                    </div>
                  </div>

                  {/* Bottom Row: ID, Color, Supplier */}
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[8px] font-mono mt-1">
                    <span className="font-medium">{mat.id}</span>
                    <span>•</span>
                    <span>{mat.color}</span>
                    <span>•</span>
                    <span className="text-muted-foreground font-medium uppercase">
                      {mat.supplier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
    </>
  );
}
