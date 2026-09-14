import type {
  ForecastSeasonalSummary,
  OrderSummary,
  SelectionSummary,
} from '@/utils/aggregations';
import {
  calculateSelectionBalances,
  type SelectionBalance,
} from '../domain/selection';

/** Adapts spreadsheet-shaped summaries to the selection domain model. */
export function createSelectionAnalysis(
  selections: SelectionSummary[],
  orders: OrderSummary[],
  forecasts: ForecastSeasonalSummary[],
): SelectionBalance[] {
  return calculateSelectionBalances(
    selections.map((row) => ({
      season: row.season,
      modelCode: row.modelCode,
      style: row.style,
      quantity: row.selectionQty,
    })),
    orders.map((row) => ({
      season: row.season,
      modelCode: row.modelCode,
      quantity: row.orderQty,
    })),
    forecasts.map((row) => ({
      season: row.season,
      modelCode: row.modelCode,
      quantity: row.totalQty,
    })),
  );
}
