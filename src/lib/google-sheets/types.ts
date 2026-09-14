import z from 'zod';

export const sheetValueSchema = z
  .union([z.string(), z.number(), z.boolean()])
  .nullish();

export type SheetValue = z.infer<typeof sheetValueSchema>;

export type SheetRow = Record<string, SheetValue>;
