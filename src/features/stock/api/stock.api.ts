import { SHEETS } from '@/config/sheetConfig';
import { fetchSheet } from '@/lib/google-sheets/fetch';
import { stockListSchema } from './stock.schema';

export const fetchStock = async () => {
  const data = await fetchSheet({
    spreadsheetId: SHEETS.warehouse.spreadsheetId,
    ...SHEETS.warehouse.stock,
  });

  return stockListSchema.parse(data);
};
