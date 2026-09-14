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
  return calculateSelectionBalances(selections, orders, forecasts);
}
