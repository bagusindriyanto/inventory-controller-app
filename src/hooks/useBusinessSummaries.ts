import { useMemo } from 'react';
import { useBusinessData } from './useMasterData';
import {
  aggregateForecastSeasonalSummaries,
  aggregateForecastSummaries,
  aggregateOrderSummaries,
  aggregateSelectionSummaries,
} from '@/utils/aggregations';

export function useBusinessSummaries() {
  const { selection, order, forecast } = useBusinessData();

  const selectionSummary = useMemo(
    () => aggregateSelectionSummaries(selection.data ?? []),
    [selection.data],
  );

  const orderSummary = useMemo(
    () => aggregateOrderSummaries(order.data ?? []),
    [order.data],
  );

  const forecastSummary = useMemo(
    () => aggregateForecastSummaries(forecast.data ?? []),
    [forecast.data],
  );

  const forecastSeasonalSummary = useMemo(
    () => aggregateForecastSeasonalSummaries(forecast.data ?? []),
    [forecast.data],
  );

  return {
    selection,
    order,
    forecast,
    selectionSummary,
    orderSummary,
    forecastSummary,
    forecastSeasonalSummary,
  };
}