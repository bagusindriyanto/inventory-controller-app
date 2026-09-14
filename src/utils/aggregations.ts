import type { Forecast } from '@/features/forecast/api/forecast.schema';
import type { Order } from '@/features/order/api/order.schema';
import type { Selection } from '@/features/selection/api/selection.schema';

type Aggregators<T> = {
  [K in keyof T]-?: (current: T[K] | undefined, incoming: T[K]) => T[K];
};

type AggregateResult<T, G extends keyof T, R> = {
  [K in G]: NonNullable<T[K]>;
} & {
  [K in keyof R]: R[K] extends (...args: never[]) => infer Result ? Result : never;
};

/**
 * Groups rows by JSON-serializable column values, skipping nullish group keys.
 * Reducers receive undefined on the first row and must not mutate incoming values.
 * Results contain only group and aggregate columns, in first-seen group order.
 * Aggregate column types are inferred from reducer return types.
 */
export function groupByAggregate<
  T extends object,
  G extends keyof T,
  A extends Exclude<keyof T, G>,
  R extends Pick<Aggregators<T>, A>,
>(
  data: readonly T[],
  groupBy: readonly G[],
  aggregators: Pick<Aggregators<T>, A> & R,
): AggregateResult<T, G, R>[] {
  const map = new Map<string, Pick<T, G | A>>();
  const fields = Reflect.ownKeys(aggregators) as A[];
  const reducers: Pick<Aggregators<T>, A> = aggregators;

  for (const row of data) {
    if (groupBy.some((field) => row[field] == null)) continue;

    const key = JSON.stringify(groupBy.map((field) => row[field]));

    let current = map.get(key);

    if (!current) {
      current = Object.fromEntries([
        ...groupBy.map((field) => [field, row[field]]),
        ...fields.map((field) => [field, undefined]),
      ]) as Pick<T, G | A>;
      map.set(key, current);
    }

    for (const field of fields) {
      current[field] = reducers[field](current[field], row[field]);
    }
  }

  return [...map.values()] as AggregateResult<T, G, R>[];
}

/** Nullish quantities contribute zero, including in single-row groups. */
export const sumNumber = (
  a: number | null | undefined,
  b: number | null | undefined,
): number => (a ?? 0) + (b ?? 0);

/** Sums a numeric record by key. All present keys have numeric values; nullish values become zero. */
export const sumByKey = (
  current: Record<string, number | null | undefined> | undefined,
  incoming: Record<string, number | null | undefined>,
): Record<string, number> => {
  const result = new Map(
    Object.entries(current ?? {}).map(([key, value]) => [key, value ?? 0]),
  );

  for (const [key, value] of Object.entries(incoming)) {
    result.set(key, sumNumber(result.get(key), value));
  }

  return Object.fromEntries(result);
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
    weeks: sumByKey,
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
