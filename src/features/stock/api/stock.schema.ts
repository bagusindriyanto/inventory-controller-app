import z from 'zod';

export const stockSchema = z
  .object({
    ID: z.string().nullable(),
    Name: z.string().nullable(),
    Color: z.coerce.string().nullable(),
    'Unit Cons': z.string().nullable(),
    'Qty Cons (Inventory In)': z.coerce.number().nullable(),
    'Qty Cons (Buffer In)': z.coerce.number().nullable(),
    Total: z.coerce.number().nullable(),
  })
  .transform((row) => ({
    id: row.ID,
    name: row.Name,
    color: row.Color,
    inventoryQty: row['Qty Cons (Inventory In)'],
    bufferQty: row['Qty Cons (Buffer In)'],
    totalQty: row.Total,
  }));

export const stockListSchema = z.array(stockSchema);

export type Stock = z.output<typeof stockSchema>;
