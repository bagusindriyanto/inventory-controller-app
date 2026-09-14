export type SelectionBalanceInput = {
  season: string;
  modelCode: string;
  style: string;
  quantity: number;
};

export type OrderQuantityInput = {
  season: string;
  modelCode: string;
  quantity: number;
};

export type ForecastQuantityInput = {
  season: string;
  modelCode: string;
  quantity: number;
};

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
  selections: SelectionBalanceInput[],
  orders: OrderQuantityInput[],
  forecasts: ForecastQuantityInput[],
): SelectionBalance[] {
  const orderLookup = new Map(
    orders.map((order) => [
      createLookupKey(order.season, order.modelCode),
      order.quantity,
    ]),
  );
  const forecastLookup = new Map(
    forecasts.map((forecast) => [
      createLookupKey(forecast.season, forecast.modelCode),
      forecast.quantity,
    ]),
  );

  return selections.map((selection) => {
    const key = createLookupKey(selection.season, selection.modelCode);
    const orderQty = orderLookup.get(key) ?? 0;
    const forecastQty = forecastLookup.get(key) ?? 0;
    const remainingSelection = selection.quantity - orderQty - forecastQty;
    const status = getStatus(remainingSelection);

    return {
      season: selection.season,
      modelCode: selection.modelCode,
      style: selection.style,
      selectionQty: selection.quantity,
      orderQty,
      forecastQty,
      remainingSelection,
      status,
    };
  });
}
