import z from 'zod';

export const materialSchema = z
  .object({
    Buyer: z.string().nullable(),
    Season: z.string().nullable(),
    'R3/SKU': z.coerce.string().nullable(),
    Style: z.string().nullable(),
    Unit: z.string().nullable(),
    ID: z.string().nullable(),
    NAMA: z.string().nullable(),
    COLOR: z.string().nullable(),
    UOM: z.string().nullable(),
    CONS: z.coerce.number().nullable(),
    'LT material': z.coerce.number().nullable(),
  })
  .transform((row) => ({
    id: row.ID,
    name: row.NAMA,
    color: row.COLOR,
    consumption: row.CONS,
    buyer: row.Buyer,
    season: row.Season,
    modelCode: row['R3/SKU'],
    style: row.Style,
    unit: row.Unit,
    uom: row.UOM,
    leadTime: row['LT material'],
  }));

export const materialListSchema = z.array(materialSchema);

export type Material = z.output<typeof materialSchema>;
