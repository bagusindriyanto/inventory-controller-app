import type {
  ForecastSeasonalSummary,
  OrderSummary,
  SelectionSummary,
} from '@/utils/aggregations';

export type SelectionBalanceStatus = 'Over-consumed' | 'Balanced' | 'Surplus';

export type SelectionBalance = {
  season: string;
  modelCode: string;
  style: string;
  selectionQty: number;
  orderQty: number;
  forecastQty: number;
  remainingSelection: number;
  status: SelectionBalanceStatus;
};

const createLookupKey = (season: string, modelCode: string): string =>
  JSON.stringify([season, modelCode]);

const getStatus = (remaining: number): SelectionBalanceStatus => {
  if (remaining < 0) return 'Over-consumed';
  if (remaining === 0) return 'Balanced';
  return 'Surplus';
};

/** Calculates the remaining seasonal selection after orders and forecasts. */
export function calculateSelectionBalances(
  selections: SelectionSummary[],
  orders: OrderSummary[],
  forecasts: ForecastSeasonalSummary[],
): SelectionBalance[] {
  const orderLookup = new Map(
    orders.map((order) => [
      createLookupKey(order.season, order.modelCode),
      order.orderQty,
    ]),
  );
  const forecastLookup = new Map(
    forecasts.map((forecast) => [
      createLookupKey(forecast.season, forecast.modelCode),
      forecast.totalQty,
    ]),
  );

  return selections.map((selection) => {
    const key = createLookupKey(selection.season, selection.modelCode);
    const orderQty = orderLookup.get(key) ?? 0;
    const forecastQty = forecastLookup.get(key) ?? 0;
    const remainingSelection = selection.selectionQty - orderQty - forecastQty;
    const status = getStatus(remainingSelection);

    return {
      season: selection.season,
      modelCode: selection.modelCode,
      style: selection.style,
      selectionQty: selection.selectionQty,
      orderQty,
      forecastQty,
      remainingSelection,
      status,
    };
  });
}
