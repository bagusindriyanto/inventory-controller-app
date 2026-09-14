import { SHEETS } from '@/config/sheetConfig';
import { fetchSheet } from '@/lib/google-sheets/fetch';
import { forecastListSchema } from './forecast.schema';
import z, { ZodError } from 'zod';

export const fetchForecast = async () => {
  try {
    const data = await fetchSheet({
      spreadsheetId: SHEETS.business.spreadsheetId,
      ...SHEETS.business.forecast,
    });

    return forecastListSchema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      console.error('Schema mismatch:', z.treeifyError(err));
    }
    throw err;
  }
};
