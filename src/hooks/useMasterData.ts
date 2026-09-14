import { useFetchSelection } from '@/features/selection/api/selection.query';
import { useFetchOrder } from '@/features/order/api/order.query';
import { useFetchForecast } from '@/features/forecast/api/forecast.query';
import { useFetchMaterial } from '@/features/material/api/material.query';
import { useFetchStock } from '@/features/stock/api/stock.query';

export function useBusinessData() {
  const selection = useFetchSelection();
  const order = useFetchOrder();
  const forecast = useFetchForecast();

  return { selection, order, forecast };
}

export function useWarehouseData() {
  const material = useFetchMaterial();
  const stock = useFetchStock();

  return { material, stock };
}
