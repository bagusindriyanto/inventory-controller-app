import { useSheet } from './useSheet';
import { SHEETS } from '@/config/sheetConfig';
import {
  ForecastSchema,
  MaterialSchema,
  OrderSchema,
  SelectionSchema,
  StockSchema,
  type Forecast,
  type Material,
  type Order,
  type Selection,
  type Stock,
} from '@/schemas/rawData';

export function useBusinessData() {
  const selection = useSheet<Selection>({
    spreadsheetId: SHEETS.business.spreadsheetId,
    ...SHEETS.business.selection,
    schema: SelectionSchema,
  });
  const order = useSheet<Order>({
    spreadsheetId: SHEETS.business.spreadsheetId,
    ...SHEETS.business.order,
    schema: OrderSchema,
  });
  const forecast = useSheet<Forecast>({
    spreadsheetId: SHEETS.business.spreadsheetId,
    ...SHEETS.business.forecast,
    schema: ForecastSchema,
  });

  return { selection, order, forecast };
}

export function useWarehouseData() {
  const material = useSheet<Material>({
    spreadsheetId: SHEETS.warehouse.spreadsheetId,
    ...SHEETS.warehouse.material,
    schema: MaterialSchema,
  });
  const stock = useSheet<Stock>({
    spreadsheetId: SHEETS.warehouse.spreadsheetId,
    ...SHEETS.warehouse.stock,
    schema: StockSchema,
  });

  return { material, stock };
}