import { SHEETS } from '@/config/sheetConfig';
import { fetchSheet } from '@/lib/google-sheets/fetch';
import { selectionListSchema } from './selection.schema';

export const fetchSelection = async () => {
  const data = await fetchSheet({
    spreadsheetId: SHEETS.business.spreadsheetId,
    ...SHEETS.business.selection,
  });

  return selectionListSchema.parse(data);
};
