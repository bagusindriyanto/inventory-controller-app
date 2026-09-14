import z from 'zod';

export const orderSchema = z
  .object({
    Season: z.string().nullable(),
    'Order Type': z.enum(['MTS', 'MTO', 'WO']).nullable(),
    PO: z.coerce.string().nullable(),
    'Model Code': z.coerce.string().nullable(),
    Style: z.string().nullable(),
    'Qty ORDER': z.coerce.number().nullable(),
  })
  .transform((row) => ({
    orderType: row['Order Type'],
    season: row.Season,
    poCode: row.PO,
    modelCode: row['Model Code'],
    style: row.Style,
    orderQty: row['Qty ORDER'],
  }));

export const orderListSchema = z.array(orderSchema);

export type Order = z.output<typeof orderSchema>;
