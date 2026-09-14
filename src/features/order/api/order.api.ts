import { SHEETS } from '@/config/sheetConfig';
import { fetchSheet } from '@/lib/google-sheets/fetch';
import { orderListSchema } from './order.schema';

export const fetchOrder = async () => {
  const data = await fetchSheet({
    spreadsheetId: SHEETS.business.spreadsheetId,
    ...SHEETS.business.order,
  });

  return orderListSchema.parse(data);
};
