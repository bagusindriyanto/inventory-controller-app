import type { Forecast, Order, Selection } from '@/schemas/rawData';

export type ForecastWeek = Extract<keyof Forecast, number>;

export const FORECAST_WEEK_KEYS = Array.from(
  { length: 27 },
  (_, i) => (i + 27) as ForecastWeek,
);

const valueOf = (v: number | null | undefined): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0;

function groupRows<T, Out extends object>(
  rows: T[],
  keyOf: (row: T) => unknown[],
  initial: () => Out,
  accumulate: (acc: Out, row: T) => void,
  keep?: (row: T) => boolean,
): Out[] {
  const groups = new Map<string, Out>();

  for (const row of rows) {
    if (keep && !keep(row)) continue;

    const keyParts = keyOf(row);
    if (keyParts.some((part) => part === null || part === undefined || part === '')) {
      continue;
    }

    const key = JSON.stringify(keyParts);
    let acc = groups.get(key);
    if (!acc) {
      acc = initial();
      groups.set(key, acc);
    }
    accumulate(acc, row);
  }

  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([, value]) => value);
}

export type SelectionSummary = {
  Season: string;
  'Model Code': number;
  Style: string;
  'SUM of Selection': number;
};

export function aggregateSelectionSummaries(rows: Selection[]): SelectionSummary[] {
  return groupRows(
    rows,
    (r) => [r.Season, r['Model Code'], r.Style],
    () => ({ Season: '', 'Model Code': 0, Style: '', 'SUM of Selection': 0 }),
    (acc, r) => {
      acc.Season = r.Season ?? '';
      acc['Model Code'] = r['Model Code'] ?? 0;
      acc.Style = r.Style ?? '';
      acc['SUM of Selection'] += valueOf(r['SUM of Selection']);
    },
    (r) => r['MTS?'] !== null && r['MTS?'] !== '',
  );
}

export type OrderSummary = {
  Season: string;
  'Model Code': number;
  'Qty ORDER': number;
};

export function aggregateOrderSummaries(rows: Order[]): OrderSummary[] {
  return groupRows(
    rows,
    (r) => [r.Season, r['Model Code']],
    () => ({ Season: '', 'Model Code': 0, 'Qty ORDER': 0 }),
    (acc, r) => {
      acc.Season = r.Season ?? '';
      acc['Model Code'] = r['Model Code'] ?? 0;
      acc['Qty ORDER'] += valueOf(r['Qty ORDER']);
    },
  );
}

export type ForecastSummary = {
  Model: string;
  'Model Code': number;
  Totals: number;
  'Qty Pcs': number;
} & Record<ForecastWeek, number>;

export function aggregateForecastSummaries(rows: Forecast[]): ForecastSummary[] {
  return groupRows(
    rows,
    (r) => [r.Model, r['Model Code']],
    (): ForecastSummary => ({
      Model: '',
      'Model Code': 0,
      Totals: 0,
      'Qty Pcs': 0,
      ...(Object.fromEntries(
        FORECAST_WEEK_KEYS.map((week) => [week, 0]),
      ) as Record<ForecastWeek, number>),
    }),
    (acc, r) => {
      acc.Model = r.Model ?? '';
      acc['Model Code'] = r['Model Code'] ?? 0;
      acc.Totals += valueOf(r.Totals);
      acc['Qty Pcs'] += valueOf(r['Qty Pcs']);
      for (const week of FORECAST_WEEK_KEYS) {
        acc[week] += valueOf(r[week]);
      }
    },
    (r) => r.Season !== null && r.Model !== '#N/A',
  );
}

export type ForecastSeasonalSummary = {
  Season: string;
  Model: string;
  'Model Code': number;
  Totals: number;
};

export function aggregateForecastSeasonalSummaries(
  rows: Forecast[],
): ForecastSeasonalSummary[] {
  return groupRows(
    rows,
    (r) => [r.Season, r.Model, r['Model Code']],
    () => ({ Season: '', Model: '', 'Model Code': 0, Totals: 0 }),
    (acc, r) => {
      acc.Season = r.Season ?? '';
      acc.Model = r.Model ?? '';
      acc['Model Code'] = r['Model Code'] ?? 0;
      acc.Totals += valueOf(r.Totals);
    },
    (r) => r.Model !== '#N/A',
  );
}