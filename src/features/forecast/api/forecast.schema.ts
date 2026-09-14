import { sheetValueSchema } from '@/lib/google-sheets/types';
import z from 'zod';

export const forecastSchema = z
  .object({
    Season: z.string().nullable(),
    'Passion Brand': z.string().nullable(),
    'Model Code': z.coerce.string().nullable(),
    'MTO/MTS': z.enum(['MTO', 'MTS']).nullable(),
    Model: z.string().nullable(),
    UOM: z.string().nullable(),
    Totals: z.coerce.number().nullable(),
    'Qty Pcs': z.coerce.number().nullable(),
  })
  .catchall(sheetValueSchema)
  .transform((row) => {
    const weeks: Record<number, number | null | undefined> = {};

    for (const [key, value] of Object.entries(row)) {
      const week = Number(key);

      if (Number.isInteger(week) && week >= 1 && week <= 53) {
        weeks[week] = z.number().nullish().parse(value);
      }
    }

    return {
      orderType: row['MTO/MTS'],
      season: row.Season,
      passionBrand: row['Passion Brand'],
      modelCode: row['Model Code'],
      style: row['Model'],
      uom: row.UOM,
      totalQty: row.Totals,
      pcsQty: row['Qty Pcs'],
      weeks,
    };
  });

export const forecastListSchema = z.array(forecastSchema);

export type Forecast = z.output<typeof forecastSchema>;
