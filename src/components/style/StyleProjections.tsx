import { useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleXIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ForecastWeek } from '@/utils/aggregations';
import { formatNumber } from '@/utils/numberFormatter';
import { createLookupKey } from '@/utils/createLookupKey';
import type {
  MaterialStockInfo,
  RemainingStockEntry,
  SolverResult,
} from '@/utils/solver';
import { Badge } from '@/components/ui/badge';

const ALL_STYLES = 'all';

type MaterialMonitorRow = {
  id: string;
  name: string;
  color: string;
  unit: string;
  buyer: string;
  available: number;
  required: number;
  allocated: number;
  remaining: number;
  shortage: number;
};

type MaterialTotal = Omit<MaterialMonitorRow, 'available' | 'shortage'>;

function getMaterialRows(
  usages: MaterialStockInfo[],
  remaining: RemainingStockEntry[],
  isSingleStyle: boolean,
): MaterialMonitorRow[] {
  const totals = new Map<string, MaterialTotal>();

  for (const material of usages) {
    const current = totals.get(material.id);
    totals.set(material.id, {
      id: material.id,
      name: material.name,
      color: material.color,
      unit: material.unit,
      buyer: material.buyer,
      required: (current?.required ?? 0) + material.needed,
      allocated: (current?.allocated ?? 0) + material.actual,
      remaining: material.remaining,
    });
  }

  for (const material of remaining) {
    const current = totals.get(material.id);
    totals.set(material.id, {
      id: material.id,
      name: current?.name ?? material.name,
      color: current?.color ?? material.color,
      unit: current?.unit ?? material.unit,
      buyer: current?.buyer ?? material.buyer,
      required: current?.required ?? 0,
      allocated: current?.allocated ?? 0,
      remaining: isSingleStyle
        ? (current?.remaining ?? material.qty)
        : material.qty,
    });
  }

  return [...totals.values()]
    .map((material) => {
      const available = material.remaining + material.allocated;
      return {
        ...material,
        available,
        shortage: Math.max(material.required - available, 0),
      };
    })
    .sort((a, b) => b.shortage - a.shortage || a.name.localeCompare(b.name));
}

export type StyleProjectionsProps = {
  optimumReport: SolverResult;
};

export default function StyleProjections({
  optimumReport,
}: StyleProjectionsProps) {
  const { weeks, styles, remainingByWeek } = optimumReport;
  const [selectedWeek, setSelectedWeek] = useState<ForecastWeek | null>(null);
  const [selectedStyleKey, setSelectedStyleKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shortageOnly, setShortageOnly] = useState(false);

  const activeWeek =
    selectedWeek !== null && weeks.includes(selectedWeek)
      ? selectedWeek
      : (weeks[0] ?? null);
  const selectedStyle = styles.find(
    (style) =>
      createLookupKey(style.season, style.modelCode) === selectedStyleKey,
  );
  const activeWeekIndex = activeWeek === null ? -1 : weeks.indexOf(activeWeek);

  const materialRows = useMemo(() => {
    if (activeWeek === null) return [];

    const usages = selectedStyle
      ? (selectedStyle.weeks[activeWeek]?.materialsStock ?? [])
      : styles.flatMap(
          (style) => style.weeks[activeWeek]?.materialsStock ?? [],
        );
    const remaining = selectedStyle ? [] : (remainingByWeek[activeWeek] ?? []);

    return getMaterialRows(usages, remaining, selectedStyle !== undefined);
  }, [activeWeek, remainingByWeek, selectedStyle, styles]);

  const visibleMaterials = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('id-ID');
    return materialRows.filter((material) => {
      const matchesSearch =
        !query ||
        material.name.toLocaleLowerCase('id-ID').includes(query) ||
        material.id.toLocaleLowerCase('id-ID').includes(query) ||
        material.buyer.toLocaleLowerCase('id-ID').includes(query);
      return matchesSearch && (!shortageOnly || material.shortage > 0);
    });
  }, [materialRows, searchQuery, shortageOnly]);

  const shortageCount = materialRows.filter(
    (material) => material.shortage > 0,
  ).length;
  const purchasePlan = selectedStyle?.purchasePlan;

  const selectWeek = (
    week: ForecastWeek,
    styleKey: string | null = null,
    showMonitor = false,
  ) => {
    setSelectedWeek(week);
    setSelectedStyleKey(styleKey);

    if (showMonitor) {
      document
        .getElementById('material-monitor')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const report = (
    <Card>
      <CardHeader>
        <CardTitle>Optimal Output per Style</CardTitle>
        <CardDescription>
          Menampilkan jumlah pcs teroptimal yang bisa diproduksi berdasarkan
          ketersediaan stok material.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          Klik header minggu untuk melihat detail seluruh style. Klik cell Week
          to Buy untuk melihat detail satu style.
        </div>

        <div className="max-h-[60vh] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 min-w-52 bg-card">
                  Style
                </TableHead>
                <TableHead className="min-w-28 text-center">
                  Week to Buy
                </TableHead>
                {weeks.map((week) => (
                  <TableHead key={week} className="min-w-24 text-center">
                    <Button
                      variant={
                        activeWeek === week && selectedStyleKey === null
                          ? 'secondary'
                          : 'ghost'
                      }
                      size="xs"
                      aria-label={`Lihat seluruh material minggu ${week}`}
                      aria-pressed={
                        activeWeek === week && selectedStyleKey === null
                      }
                      onClick={() => selectWeek(week, null, true)}
                    >
                      W{week}
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {styles.map((style) => {
                const styleKey = createLookupKey(style.season, style.modelCode);
                const trigger = style.purchasePlan.orderTriggerWeek;
                const triggerVariant =
                  trigger === 'Terlambat'
                    ? 'destructive'
                    : trigger === 'Aman'
                      ? 'success'
                      : 'warning';

                return (
                  <TableRow key={styleKey}>
                    <TableCell className="sticky left-0 z-10 bg-card uppercase">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{style.style}</span>
                        <span className="text-xs text-muted-foreground">
                          {style.season} · {style.modelCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant={triggerVariant}
                        size="xs"
                        onClick={() =>
                          selectWeek(
                            style.purchasePlan.shortageWeek ??
                              activeWeek ??
                              weeks[0],
                            styleKey,
                            true,
                          )
                        }
                      >
                        {trigger === 'Terlambat' ? (
                          <CircleXIcon data-icon="inline-start" />
                        ) : trigger === 'Aman' ? (
                          <CheckCircleIcon data-icon="inline-start" />
                        ) : (
                          <CircleAlertIcon data-icon="inline-start" />
                        )}
                        {typeof trigger === 'number' ? `W${trigger}` : trigger}
                      </Button>
                    </TableCell>
                    {weeks.map((week) => {
                      const allocation = style.weeks[week];
                      if (!allocation) {
                        return (
                          <TableCell key={week} className="text-center">
                            <span className="text-muted-foreground">-</span>
                          </TableCell>
                        );
                      }

                      const variant =
                        allocation.status === 'Tidak Cukup'
                          ? 'destructive'
                          : allocation.status === 'Sebagian'
                            ? 'warning'
                            : 'ghost';

                      return (
                        <TableCell key={week} className="text-center">
                          <Button
                            variant={variant}
                            size="sm"
                            className="h-auto w-full flex-col"
                            aria-label={`${style.season}, ${style.style}, minggu ${week}: alokasi ${allocation.actual} dari forecast ${allocation.forecast}`}
                            aria-pressed={
                              activeWeek === week &&
                              selectedStyleKey === styleKey
                            }
                            onClick={() => selectWeek(week, styleKey, true)}
                          >
                            <span className="font-semibold tabular-nums">
                              {formatNumber(allocation.actual)}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              / {formatNumber(allocation.forecast)}
                            </span>
                          </Button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const monitor = (
    <Card id="material-monitor" className="scroll-mt-4">
      <CardHeader>
        <CardTitle>Stok Material</CardTitle>
        <CardDescription>
          Menampilkan stok ketersediaan, kebutuhan, dan alokasi material setiap
          minggunya.
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Minggu sebelumnya"
            disabled={activeWeekIndex <= 0}
            onClick={() => selectWeek(weeks[activeWeekIndex - 1])}
          >
            <ChevronLeftIcon />
          </Button>
          <p className="w-18 text-center font-semibold">
            {activeWeek === null ? 'Semua Week' : `W${activeWeek}`}
          </p>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Minggu berikutnya"
            disabled={
              activeWeekIndex < 0 || activeWeekIndex >= weeks.length - 1
            }
            onClick={() => selectWeek(weeks[activeWeekIndex + 1])}
          >
            <ChevronRightIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={selectedStyleKey ?? ALL_STYLES}
            onValueChange={(value) =>
              setSelectedStyleKey(value === ALL_STYLES ? null : value)
            }
          >
            <SelectTrigger className="w-full sm:w-110">
              <SelectValue className="truncate font-medium">
                {selectedStyle
                  ? `${selectedStyle.season} · ${selectedStyle.style}`
                  : 'Semua style'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_STYLES}>Semua style</SelectItem>
                {styles.map((style) => (
                  <SelectItem
                    key={createLookupKey(style.season, style.modelCode)}
                    value={createLookupKey(style.season, style.modelCode)}
                  >
                    <span className="flex flex-col items-start gap-0.5 min-w-0 w-full whitespace-normal">
                      <span className="text-sm font-medium wrap-break-word leading-tight">
                        {style.style}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {style.season} · {style.modelCode}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari material, ID, atau buyer"
            aria-label="Cari material"
          />
          <Button
            variant={shortageOnly ? 'secondary' : 'outline'}
            aria-pressed={shortageOnly}
            onClick={() => setShortageOnly((current) => !current)}
          >
            Kekurangan saja ({shortageCount})
          </Button>
        </div>

        {purchasePlan && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              Shortage:{' '}
              {purchasePlan.shortageWeek === null
                ? 'Aman'
                : `W${purchasePlan.shortageWeek}`}
            </span>
            <span>
              Rekomendasi beli:{' '}
              {typeof purchasePlan.orderTriggerWeek === 'number'
                ? `W${purchasePlan.orderTriggerWeek}`
                : purchasePlan.orderTriggerWeek}
            </span>
            <span>Lead time: {purchasePlan.maxLeadTimeDays} hari</span>
          </div>
        )}

        <div className="max-h-[60vh] overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Tersedia</TableHead>
                <TableHead className="text-right">Kebutuhan</TableHead>
                <TableHead className="text-right">Dialokasikan</TableHead>
                <TableHead className="text-right">Sisa</TableHead>
                <TableHead className="text-center">Kekurangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleMaterials.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Tidak ada material untuk filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                visibleMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{material.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {material.id} · {material.color} · {material.buyer}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      <span className="font-semibold">
                        {formatNumber(material.available, 2)}
                      </span>
                      <span className="ml-1 text-muted-foreground text-[10px]">
                        {material.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      <span className="font-semibold">
                        {formatNumber(material.required, 2)}
                      </span>
                      <span className="ml-1 text-muted-foreground text-[10px]">
                        {material.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      <span className="font-semibold">
                        {formatNumber(material.allocated, 2)}
                      </span>
                      <span className="ml-1 text-muted-foreground text-[10px]">
                        {material.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      <span className="font-semibold">
                        {formatNumber(material.remaining, 2)}
                      </span>
                      <span className="ml-1 text-muted-foreground text-[10px]">
                        {material.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs">
                      {material.shortage > 0 ? (
                        <Badge variant="destructive">
                          <span>-{formatNumber(material.shortage, 2)}</span>
                          <span className="text-[10px]">{material.unit}</span>
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          <CheckCircleIcon data-icon="inline-start" />
                          Aman
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      {monitor}
      {report}
    </div>
  );
}
