import type { Forecast } from '@/features/forecast/api/forecast.schema';
import type { Order } from '@/features/order/api/order.schema';
import type { Selection } from '@/features/selection/api/selection.schema';

type Aggregators<T> = {
  [K in keyof T]?: (current: T[K], incoming: T[K]) => T[K];
};

type AggregateResult<T, G extends keyof T, A extends keyof T> = {
  [K in G]: NonNullable<T[K]>;
} & { [K in A]: T[K] };

export function groupByAggregate<
  T extends Record<string, unknown>,
  G extends keyof T,
  A extends keyof T,
>(
  data: T[],
  groupBy: readonly G[],
  aggregators: Pick<Aggregators<T>, A>,
): AggregateResult<T, G, A>[] {
  const map = new Map<string, Pick<T, G | A>>();

  for (const row of data) {
    if (groupBy.some((field) => row[field] == null)) continue;

    const key = JSON.stringify(groupBy.map((field) => row[field]));

    const current = map.get(key);

    if (!current) {
      const initial = {} as Pick<T, G | A>;

      for (const field of groupBy) {
        initial[field] = row[field];
      }

      for (const field of Object.keys(aggregators) as A[]) {
        initial[field] = structuredClone(row[field]);
      }

      map.set(key, initial);
      continue;
    }

    for (const field of Object.keys(aggregators) as A[]) {
      const aggregate = aggregators[field];

      if (aggregate) {
        current[field] = aggregate(current[field], row[field]);
      }
    }
  }

  return [...map.values()] as AggregateResult<T, G, A>[];
}

const sumNumber = (a: number | null, b: number | null): number =>
  (a ?? 0) + (b ?? 0);

const sumWeeks = (
  current: Record<number, number | null | undefined>,
  incoming: Record<number, number | null | undefined>,
) => {
  const result = { ...current };

  for (const [week, value] of Object.entries(incoming)) {
    const key = Number(week);

    result[key] = (result[key] ?? 0) + (value ?? 0);
  }

  return result;
};

export function aggregateSelectionSummaries(rows: Selection[]) {
  return groupByAggregate(rows, ['season', 'modelCode', 'style'], {
    selectionQty: sumNumber,
  });
}

export type SelectionSummary = ReturnType<
  typeof aggregateSelectionSummaries
>[number];

export function aggregateOrderSummaries(rows: Order[]) {
  return groupByAggregate(rows, ['season', 'modelCode'], {
    orderQty: sumNumber,
  });
}

export type OrderSummary = ReturnType<typeof aggregateOrderSummaries>[number];

export function aggregateForecastSummaries(rows: Forecast[]) {
  return groupByAggregate(rows, ['modelCode', 'style'], {
    totalQty: sumNumber,
    pcsQty: sumNumber,
    weeks: sumWeeks,
  });
}

export type ForecastSummary = ReturnType<
  typeof aggregateForecastSummaries
>[number];

export function aggregateForecastSeasonalSummaries(rows: Forecast[]) {
  return groupByAggregate(rows, ['season', 'modelCode', 'style'], {
    totalQty: sumNumber,
  });
}

export type ForecastSeasonalSummary = ReturnType<
  typeof aggregateForecastSeasonalSummaries
>[number];
