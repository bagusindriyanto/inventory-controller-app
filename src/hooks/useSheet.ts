import { useQuery } from '@tanstack/react-query';
import type { ZodType } from 'zod';
import { fetchSheet, type SheetRow } from '@/utils/googleSheets';

type UseSheetOptions<T> = {
  spreadsheetId: string;
  sheetName: string;
  range: string;
  schema?: ZodType<T>;
};

export const sheetKeys = {
  all: ['sheets'] as const,
  range: (spreadsheetId: string, sheetName: string, range: string) =>
    [...sheetKeys.all, spreadsheetId, sheetName, range] as const,
};

const MAX_WARNED_ROWS = 3;

export function useSheet<T extends Record<string, unknown> = SheetRow>({
  spreadsheetId,
  sheetName,
  range,
  schema,
}: UseSheetOptions<T>) {
  return useQuery<T[]>({
    queryKey: sheetKeys.range(spreadsheetId, sheetName, range),
    queryFn: async () => {
      const rows = await fetchSheet<SheetRow>(spreadsheetId, sheetName, range);
      if (!schema) return rows as T[];

      const valid: T[] = [];
      let dropped = 0;
      for (const row of rows) {
        const parsed = schema.safeParse(row);
        if (parsed.success) {
          valid.push(parsed.data);
        } else {
          dropped += 1;
          if (dropped <= MAX_WARNED_ROWS) {
            console.warn(
              `[useSheet] Invalid row in "${sheetName}":`,
              parsed.error.issues.map(
                (issue) =>
                  `${issue.path.join('.').padEnd(20)} ${issue.message}`,
              ),
              row,
            );
          }
        }
      }
      if (dropped > 0) {
        console.warn(
          `[useSheet] "${sheetName}": dropped ${dropped} of ${rows.length} row(s).`,
        );
      }
      return valid;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
