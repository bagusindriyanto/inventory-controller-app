import { z } from 'zod';

const num = () => z.coerce.number().nullable();

export const SelectionSchema = z.object({
  'MTS?': z.string().nullable(),
  Season: z.string().nullable(),
  PB: z.string().nullable(),
  'Model Code': z.coerce.string().nullable(),
  Style: z.string().nullable(),
  'SUM of Selection': num(),
  'SUM of ORDER Qty': num(),
});
export type Selection = z.infer<typeof SelectionSchema>;

export const OrderSchema = z.object({
  Season: z.string().nullable(),
  'Order Type': z.string().nullable(),
  PO: z.coerce.string().nullable(),
  'SPO No.': z.string().nullable(),
  'Model Code': z.coerce.string().nullable(),
  'IMAN No.': z.coerce.string().nullable(),
  Style: z.string().nullable(),
  'Qty ORDER': num(),
});
export type Order = z.infer<typeof OrderSchema>;

export const ForecastSchema = z.object({
  Season: z.string().nullable(),
  'Passion Brand': z.string().nullable(),
  Style: z.string().nullable(),
  'Model Code': z.coerce.string().nullable(),
  CZ: z.string().nullable(),
  Destinasi: z.string().nullable(),
  Model: z.string().nullable(),
  Totals: num(),
  SS26: num(),
  SS27: num(),
  'MTO/MTS': z.string().nullable(),
  UOM: z.string().nullable(),
  'Qty Pcs': num(),
  27: num(),
  28: num(),
  29: num(),
  30: num(),
  31: num(),
  32: num(),
  33: num(),
  34: num(),
  35: num(),
  36: num(),
  37: num(),
  38: num(),
  39: num(),
  40: num(),
  41: num(),
  42: num(),
  43: num(),
  44: num(),
  45: num(),
  46: num(),
  47: num(),
  48: num(),
  49: num(),
  50: num(),
  51: num(),
  52: num(),
  53: num(),
});
export type Forecast = z.infer<typeof ForecastSchema>;

export const MaterialSchema = z.object({
  Buyer: z.string().nullable(),
  Season: z.string().nullable(),
  'R3/SKU': z.coerce.string().nullable(),
  Style: z.string().nullable(),
  Unit: z.string().nullable(),
  ID: z.string().nullable(),
  NAMA: z.string().nullable(),
  COLOR: z.string().nullable(),
  UOM: z.string().nullable(),
  CONS: num(),
  'LT material': num(),
});
export type Material = z.infer<typeof MaterialSchema>;

export const StockSchema = z.object({
  ID: z.string().nullable(),
  Name: z.string().nullable(),
  Color: z.coerce.string().nullable(),
  'Unit Cons': z.string().nullable(),
  'Qty Cons (Inventory In)': num(),
  'Qty Cons (Buffer In)': num(),
  Total: num(),
});
export type Stock = z.infer<typeof StockSchema>;
