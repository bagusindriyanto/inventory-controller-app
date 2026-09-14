import z from 'zod';

export const selectionSchema = z
  .object({
    'MTS?': z.enum(['MTS', 'MTO', 'WO']).nullable(),
    Season: z.string().nullable(),
    PB: z.string().nullable(),
    'Model Code': z.coerce.string().nullable(),
    Style: z.string().nullable(),
    'SUM of Selection': z.coerce.number().nullable(),
    'SUM of ORDER Qty': z.coerce.number().nullable(),
  })
  .transform((row) => ({
    orderType: row['MTS?'],
    season: row.Season,
    passionBrand: row.PB,
    modelCode: row['Model Code'],
    style: row.Style,
    selectionQty: row['SUM of Selection'],
    orderQty: row['SUM of ORDER Qty'],
  }));

export const selectionListSchema = z.array(selectionSchema);

export type Selection = z.output<typeof selectionSchema>;
