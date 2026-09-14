import { SHEETS } from '@/config/sheetConfig';
import { fetchSheet } from '@/lib/google-sheets/fetch';
import { materialListSchema } from './material.schema';

export const fetchMaterial = async () => {
  const data = await fetchSheet({
    spreadsheetId: SHEETS.warehouse.spreadsheetId,
    ...SHEETS.warehouse.material,
  });

  return materialListSchema.parse(data);
};
